import { summarizeFindings } from "./summary.js";
const schemaVersion = "1.0";
export function renderJson(result) {
    return `${JSON.stringify(toJsonReport(result), null, 2)}\n`;
}
export function renderJsonError(error) {
    return `${JSON.stringify({ schemaVersion, error }, null, 2)}\n`;
}
function toJsonReport(result) {
    return {
        schemaVersion,
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
function toJsonFinding(finding) {
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
//# sourceMappingURL=json.js.map