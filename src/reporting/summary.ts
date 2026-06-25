import { highestSeverity, isAtOrAboveSeverity } from "../core/severity.js";
import type { Finding, ScanResult, Severity } from "../core/types.js";

export type ReportSummary = {
  findings: number;
  highestSeverity?: Severity;
};

export function summarizeFindings(
  findings: readonly Finding[]
): ReportSummary {
  const highest = highestSeverity(findings.map((finding) => finding.severity));

  return highest === undefined
    ? { findings: findings.length }
    : { findings: findings.length, highestSeverity: highest };
}

export function hasFailingFindings(
  result: ScanResult,
  threshold: Exclude<Severity, "low">
): boolean {
  return result.findings.some((finding) =>
    isAtOrAboveSeverity(finding.severity, threshold)
  );
}
