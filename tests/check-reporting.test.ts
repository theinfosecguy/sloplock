import { describe, expect, it } from "vitest";
import { renderCheckJson, renderCheckText } from "../src/reporting/check.js";
import type { CheckPackagesResult } from "../src/core/types.js";

const result: CheckPackagesResult = {
  results: [
    {
      status: "found",
      ecosystem: "npm",
      name: "express",
      firstPublishedAt: new Date("2010-12-29T19:38:25.450Z"),
      registryUrl: "https://registry.npmjs.org/express"
    },
    { status: "not_found", ecosystem: "npm", name: "fastapi-auth-helper" },
    {
      status: "network_error",
      ecosystem: "npm",
      name: "flaky",
      message: "request timed out",
      retryable: true
    }
  ],
  findings: [
    {
      rule: "package_not_found",
      severity: "high",
      ecosystem: "npm",
      package: "fastapi-auth-helper",
      evidence: "Package does not exist in the npm registry.",
      recommendation: "Verify the intended package name before installing or merging."
    }
  ],
  warnings: [{ message: "Registry check failed for flaky: request timed out" }],
  registryFailures: [
    {
      status: "network_error",
      ecosystem: "npm",
      name: "flaky",
      message: "request timed out",
      retryable: true
    }
  ],
  failOn: "high"
};

describe("check reporting", () => {
  it("renders one line per package plus findings as text", () => {
    expect(renderCheckText(result)).toBe(
      [
        "SlopLock warnings",
        "",
        "WARNING Registry check failed for flaky: request timed out",
        "",
        "npm express: found in npm, first published 2010-12-29",
        "npm fastapi-auth-helper: not found in npm",
        "npm flaky: registry check failed (network_error): request timed out",
        "",
        "SlopLock found 1 findings",
        "",
        "HIGH npm fastapi-auth-helper",
        "  Rule: package_not_found",
        "  Evidence: Package does not exist in the npm registry.",
        "  Action: Verify the intended package name before installing or merging.",
        "",
        "Highest severity: HIGH"
      ].join("\n")
    );
  });

  it("renders an empty result without findings", () => {
    expect(
      renderCheckText({ results: [], findings: [], warnings: [], registryFailures: [], failOn: "high" })
    ).toBe("\nSlopLock found 0 findings");
  });

  it("renders JSON with ISO dates and no source key", () => {
    const report = JSON.parse(renderCheckJson(result)) as {
      schemaVersion: string;
      summary: Record<string, unknown>;
      results: Record<string, unknown>[];
      findings: Record<string, unknown>[];
      registryFailures: Record<string, unknown>[];
    };

    expect(report.schemaVersion).toBe("1.0");
    expect(report.summary).toEqual({
      findings: 1,
      highestSeverity: "high",
      checkedPackages: 3,
      failOn: "high",
      warnings: 1,
      registryFailures: 1
    });
    expect(report.results).toEqual([
      {
        ecosystem: "npm",
        package: "express",
        status: "found",
        firstPublishedAt: "2010-12-29T19:38:25.450Z",
        registryUrl: "https://registry.npmjs.org/express"
      },
      { ecosystem: "npm", package: "fastapi-auth-helper", status: "not_found" },
      {
        ecosystem: "npm",
        package: "flaky",
        status: "network_error",
        message: "request timed out",
        retryable: true
      }
    ]);
    expect(report.findings[0]).not.toHaveProperty("source");
    expect(report.findings[0]).toMatchObject({ rule: "package_not_found", package: "fastapi-auth-helper" });
    expect(report.registryFailures[0]).toMatchObject({ package: "flaky", retryable: true });
  });
});
