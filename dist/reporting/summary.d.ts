import type { Finding, ScanResult, Severity } from "../core/types.js";
export type ReportSummary = {
    findings: number;
    highestSeverity?: Severity;
};
export declare function summarizeFindings(findings: readonly Pick<Finding, "severity">[]): ReportSummary;
export declare function hasFailingFindings(result: ScanResult, threshold: Exclude<Severity, "low">): boolean;
