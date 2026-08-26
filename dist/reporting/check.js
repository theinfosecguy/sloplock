import { registryDisplayName } from "../core/packages.js";
import { summarizeFindings } from "./summary.js";
const schemaVersion = "1.0";
export function renderCheckText(result) {
    const lines = [];
    if (result.warnings.length > 0) {
        lines.push("SlopLock warnings", "");
        for (const warning of result.warnings) {
            lines.push(`WARNING ${warning.file === undefined ? warning.message : `${warning.file}: ${warning.message}`}`);
        }
        lines.push("");
    }
    for (const entry of result.results) {
        lines.push(`${entry.ecosystem} ${entry.name}: ${describeResult(entry)}`);
    }
    lines.push("", `SlopLock found ${result.findings.length} findings`);
    for (const finding of result.findings) {
        lines.push("", `${finding.severity.toUpperCase()} ${finding.ecosystem} ${finding.package}`, `  Rule: ${finding.rule}`, `  Evidence: ${finding.evidence}`, `  Action: ${finding.recommendation}`);
    }
    const summary = summarizeFindings(result.findings);
    if (summary.highestSeverity !== undefined) {
        lines.push("", `Highest severity: ${summary.highestSeverity.toUpperCase()}`);
    }
    return lines.join("\n");
}
export function renderCheckJson(result) {
    return `${JSON.stringify({
        schemaVersion,
        summary: {
            ...summarizeFindings(result.findings),
            checkedPackages: result.results.length,
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
        results: result.results.map(toJsonResult),
        findings: result.findings.map(toJsonFinding)
    }, null, 2)}\n`;
}
function describeResult(entry) {
    const registry = registryDisplayName(entry.ecosystem);
    switch (entry.status) {
        case "found":
            return entry.firstPublishedAt === undefined
                ? `found in ${registry}`
                : `found in ${registry}, first published ${entry.firstPublishedAt.toISOString().slice(0, 10)}`;
        case "not_found":
            return `not found in ${registry}`;
        default:
            return `registry check failed (${entry.status}): ${entry.message}`;
    }
}
function toJsonResult(entry) {
    switch (entry.status) {
        case "found":
            return {
                ecosystem: entry.ecosystem,
                package: entry.name,
                status: entry.status,
                ...(entry.firstPublishedAt === undefined
                    ? {}
                    : { firstPublishedAt: entry.firstPublishedAt.toISOString() }),
                ...(entry.registryUrl === undefined ? {} : { registryUrl: entry.registryUrl })
            };
        case "not_found":
            return { ecosystem: entry.ecosystem, package: entry.name, status: entry.status };
        default:
            return {
                ecosystem: entry.ecosystem,
                package: entry.name,
                status: entry.status,
                message: entry.message,
                retryable: entry.retryable
            };
    }
}
function toJsonFinding(finding) {
    return {
        rule: finding.rule,
        severity: finding.severity,
        ecosystem: finding.ecosystem,
        package: finding.package,
        ...(finding.source === undefined ? {} : { source: finding.source }),
        evidence: finding.evidence,
        recommendation: finding.recommendation
    };
}
//# sourceMappingURL=check.js.map