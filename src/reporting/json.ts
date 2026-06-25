import type { Finding, ScanResult } from "../core/types.js";
import { summarizeFindings } from "./summary.js";

export function renderJson(result: ScanResult): string {
  return `${JSON.stringify(toJsonReport(result), null, 2)}\n`;
}

function toJsonReport(result: ScanResult): unknown {
  return {
    schemaVersion: "1.0",
    summary: {
      ...summarizeFindings(result.findings),
      scannedDependencies: result.scannedDependencies,
      failOn: result.failOn,
      warnings: result.warnings.length,
      registryFailures: result.registryFailures.length
    },
    warnings: result.warnings,
    registryFailures: result.registryFailures.map((failure) => ({
      ecosystem: failure.ecosystem,
      package: failure.name,
      status: failure.status,
      message: failure.message,
      retryable: failure.retryable
    })),
    findings: result.findings.map(toJsonFinding)
  };
}

function toJsonFinding(finding: Finding): unknown {
  return {
    rule: finding.rule,
    severity: finding.severity,
    ecosystem: finding.ecosystem,
    package: finding.package,
    source: finding.source,
    evidence: finding.evidence,
    recommendation: finding.recommendation
  };
}
