import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { scan } from "../src/core/scan.js";
import type { RegistryClient, RegistryResult } from "../src/core/types.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true }))
  );
});

describe("scan", () => {
  it("reports missing and too-new npm packages", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "missing-package": "^1.0.0",
          "fresh-package": "^1.0.0",
          "old-package": "^1.0.0"
        }
      })
    });
    const now = new Date("2026-06-24T00:00:00.000Z");
    const result = await scan({
      rootDir,
      now,
      registryClient: fakeRegistry({
        "missing-package": { status: "not_found", ecosystem: "npm", name: "missing-package" },
        "fresh-package": found("fresh-package", "2026-06-22T00:00:00.000Z"),
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.findings).toHaveLength(2);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("applies allow and ignore config rules", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "missing-package": "^1.0.0",
          "fresh-package": "^1.0.0"
        }
      }),
      "sloplock.yml": `
allow:
  - ecosystem: npm
    package: missing-package
    reason: verified fixture
ignore:
  - rule: package_too_new
    ecosystem: npm
    package: fresh-package
    reason: verified fixture
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "missing-package": { status: "not_found", ecosystem: "npm", name: "missing-package" },
        "fresh-package": found("fresh-package", "2026-06-22T00:00:00.000Z")
      })
    });

    expect(result.findings).toEqual([]);
  });

  it("changed-only scans only packages introduced after the base ref", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "old-package": "^1.0.0"
        }
      })
    });

    await git(rootDir, ["init", "-b", "main"]);
    await git(rootDir, ["add", "package.json"]);
    await git(rootDir, [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-m",
      "base"
    ]);
    await git(rootDir, ["checkout", "-b", "feature"]);
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "old-package": "^1.0.0",
          "new-missing-package": "^1.0.0"
        }
      })
    );
    await git(rootDir, ["add", "package.json"]);
    await git(rootDir, [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-m",
      "feature"
    ]);

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "new-missing-package": {
          status: "not_found",
          ecosystem: "npm",
          name: "new-missing-package"
        },
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.package).toBe("new-missing-package");
  });
});

async function tempProject(files: Record<string, string>): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-"));
  tempDirs.push(tempDir);

  await Promise.all(
    Object.entries(files).map(([file, content]) =>
      writeFile(path.join(tempDir, file), content)
    )
  );

  return tempDir;
}

function found(name: string, firstPublishedAt: string): RegistryResult {
  return {
    status: "found",
    ecosystem: "npm",
    name,
    firstPublishedAt: new Date(firstPublishedAt)
  };
}

function fakeRegistry(results: Record<string, RegistryResult>): RegistryClient {
  return {
    getPackage(name: string) {
      const result = results[name];
      if (result === undefined) {
        return Promise.resolve({ status: "not_found", ecosystem: "npm", name });
      }

      return Promise.resolve(result);
    }
  };
}

async function git(rootDir: string, args: readonly string[]): Promise<void> {
  await execFileAsync("git", [...args], { cwd: rootDir });
}
