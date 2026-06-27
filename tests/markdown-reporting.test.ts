import { describe, expect, it } from "vitest";
import type { ScanResult } from "../src/core/types.js";
import {
  renderPullRequestComment,
  renderStepSummary,
  stickyCommentMarker
} from "../src/reporting/markdown.js";

describe("markdown reporting", () => {
  it("renders a reviewer-style pull request comment", () => {
    const comment = renderPullRequestComment(scanResult());

    expect(comment).toContain(stickyCommentMarker);
    expect(comment).toContain("## SlopLock dependency review");
    expect(comment).toContain("SlopLock found 1 dependency name that needs review before merge.");
    expect(comment).toContain("| Scanned dependencies | 3 |");
    expect(comment).toContain("| Registry failures | 1 |");
    expect(comment).toContain("1. **HIGH** npm package `missing-package`");
    expect(comment).toContain("- Source: `package.json:12`");
    expect(comment).toContain("- Why blocked: npm registry has no package named missing\\-package\\.");
    expect(comment).toContain("If this is private or internal");
    expect(comment).toContain("package: missing-package");
    expect(comment).toContain("## Registry checks that did not complete");
    expect(comment).toContain("## Warnings");
  });

  it("renders the step summary as the primary action dashboard", () => {
    const summary = renderStepSummary(scanResult());

    expect(summary).not.toContain(stickyCommentMarker);
    expect(summary).toContain("# SlopLock dependency review");
    expect(summary).toContain("| Findings | 1 |");
    expect(summary).toContain("| Scanned dependencies | 3 |");
    expect(summary).toContain("| Registry failures | 1 |");
    expect(summary).toContain("| HIGH | npm | missing-package |");
    expect(summary).toContain("| npm | flaky-package | network error | yes |");
  });
});

function scanResult(): ScanResult {
  return {
    findings: [
      {
        rule: "package_not_found",
        severity: "high",
        ecosystem: "npm",
        package: "missing-package",
        source: {
          file: "package.json",
          line: 12
        },
        evidence: "npm registry has no package named missing-package.",
        recommendation: "Verify the intended package name before installing or merging."
      }
    ],
    warnings: [
      {
        file: "sloplock.yml",
        message: "Allow entry should include an expires date in CI."
      }
    ],
    registryFailures: [
      {
        status: "network_error",
        ecosystem: "npm",
        name: "flaky-package",
        message: "request timed out",
        retryable: true
      }
    ],
    scannedDependencies: 3,
    failOn: "high"
  };
}
