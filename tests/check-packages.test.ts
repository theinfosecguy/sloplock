import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { UsageError } from "../src/core/errors.js";
import { checkPackages } from "../src/core/scan.js";
import type { RegistryClient, RegistryResult } from "../src/core/types.js";

const now = new Date("2026-06-24T00:00:00.000Z");
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true }))
  );
});

describe("checkPackages", () => {
  it("returns no finding for a package outside the cooldown window", async () => {
    const result = await checkPackages({
      packages: [{ ecosystem: "npm", name: "old-package" }],
      now,
      registryClient: fakeRegistry({
        "npm:old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.findings).toEqual([]);
    expect(result.registryFailures).toEqual([]);
    expect(result.results.map((entry) => entry.status)).toEqual(["found"]);
    expect(result.failOn).toBe("high");
  });

  it("reports a package inside the cooldown window with the matching severity", async () => {
    const result = await checkPackages({
      packages: [
        { ecosystem: "npm", name: "fresh-package", sourceFile: "package.json", sourceLine: 4 },
        { ecosystem: "npm", name: "recent-package" }
      ],
      now,
      registryClient: fakeRegistry({
        "npm:fresh-package": found("fresh-package", "2026-06-22T00:00:00.000Z"),
        "npm:recent-package": found("recent-package", "2026-06-01T00:00:00.000Z")
      })
    });

    expect(result.findings).toMatchObject([
      {
        rule: "package_too_new",
        severity: "high",
        package: "fresh-package",
        source: { file: "package.json", line: 4 }
      },
      { rule: "package_too_new", severity: "medium", package: "recent-package" }
    ]);
  });

  it("reports a missing package as a high severity finding", async () => {
    const result = await checkPackages({
      packages: [{ ecosystem: "pypi", name: "Missing_Package" }],
      now,
      registryClient: fakeRegistry({})
    });

    expect(result.findings).toMatchObject([
      { rule: "package_not_found", severity: "high", ecosystem: "pypi", package: "missing-package" }
    ]);
  });

  it("reports registry failures as warnings instead of findings", async () => {
    const failure: RegistryResult = {
      status: "network_error",
      ecosystem: "npm",
      name: "flaky-package",
      message: "request timed out",
      retryable: true
    };
    const result = await checkPackages({
      packages: [{ ecosystem: "npm", name: "flaky-package" }],
      now,
      registryClient: fakeRegistry({ "npm:flaky-package": failure })
    });

    expect(result.findings).toEqual([]);
    expect(result.registryFailures).toEqual([failure]);
    expect(result.results).toEqual([failure]);
    expect(result.warnings.map((warning) => warning.message)).toEqual([
      "Registry check failed for flaky-package: request timed out"
    ]);
  });

  it("applies allow rules from sloplock.yml in the root directory", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-"));
    tempDirs.push(rootDir);
    await writeFile(
      path.join(rootDir, "sloplock.yml"),
      `
allow:
  - ecosystem: npm
    package: missing-package
    reason: verified fixture
    expires: 2030-01-01
`
    );

    const result = await checkPackages({
      packages: [{ ecosystem: "npm", name: "missing-package" }],
      rootDir,
      now,
      registryClient: fakeRegistry({})
    });

    expect(result.findings).toEqual([]);
    expect(result.results.map((entry) => entry.status)).toEqual(["not_found"]);
  });

  it("skips Go modules matched by go.privateModules in sloplock.yml", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-"));
    tempDirs.push(rootDir);
    await writeFile(
      path.join(rootDir, "sloplock.yml"),
      `
go:
  privateModules:
    - github.com/acme/*
`
    );

    const result = await checkPackages({
      packages: [
        { ecosystem: "go", name: "github.com/acme/internal" },
        { ecosystem: "go", name: "github.com/public/missing" }
      ],
      rootDir,
      now,
      registryClient: fakeRegistry({})
    });

    expect(result.results.map((entry) => entry.name)).toEqual(["github.com/public/missing"]);
    expect(result.findings.map((finding) => finding.package)).toEqual(["github.com/public/missing"]);
  });

  it("rejects invalid package names with a usage error", async () => {
    const error = await checkPackages({
      packages: [{ ecosystem: "npm", name: "not a valid name" }],
      registryClient: fakeRegistry({})
    }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(UsageError);
    expect(error).toMatchObject({
      message: "Package 'not a valid name' is not a valid npm package name."
    });
  });

  it("collapses duplicate inputs into one result in first-seen order", async () => {
    const calls: string[] = [];
    const result = await checkPackages({
      packages: [
        { ecosystem: "pypi", name: "Zeta.Package" },
        { ecosystem: "npm", name: "alpha-package" },
        { ecosystem: "pypi", name: "zeta_package" },
        { ecosystem: "npm", name: "alpha-package" }
      ],
      now,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve(
            found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
          );
        }
      }
    });

    expect(calls).toEqual(["pypi:zeta-package", "npm:alpha-package"]);
    expect(result.results.map((entry) => `${entry.ecosystem}:${entry.name}`)).toEqual([
      "pypi:zeta-package",
      "npm:alpha-package"
    ]);
  });

  it("omits the finding source when no source file is given", async () => {
    const result = await checkPackages({
      packages: [{ ecosystem: "npm", name: "missing-package" }],
      now,
      registryClient: fakeRegistry({})
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).not.toHaveProperty("source");
  });
});

function found(
  name: string,
  firstPublishedAt: string,
  ecosystem: RegistryResult["ecosystem"] = "npm"
): RegistryResult {
  return {
    status: "found",
    ecosystem,
    name,
    firstPublishedAt: new Date(firstPublishedAt)
  };
}

function fakeRegistry(results: Record<string, RegistryResult>): RegistryClient {
  return {
    getPackage(reference) {
      return Promise.resolve(
        results[`${reference.ecosystem}:${reference.name}`] ?? {
          status: "not_found",
          ecosystem: reference.ecosystem,
          name: reference.name
        }
      );
    }
  };
}
