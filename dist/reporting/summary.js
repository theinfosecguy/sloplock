import { highestSeverity, isAtOrAboveSeverity } from "../core/severity.js";
export function summarizeFindings(findings) {
    const highest = highestSeverity(findings.map((finding) => finding.severity));
    return highest === undefined
        ? { findings: findings.length }
        : { findings: findings.length, highestSeverity: highest };
}
export function hasFailingFindings(result, threshold) {
    return result.findings.some((finding) => isAtOrAboveSeverity(finding.severity, threshold));
}
//# sourceMappingURL=summary.js.map