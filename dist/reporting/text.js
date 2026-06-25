import { summarizeFindings } from "./summary.js";
export function renderText(result) {
    const lines = [];
    if (result.warnings.length > 0) {
        lines.push("SlopLock warnings");
        lines.push("");
        for (const warning of result.warnings) {
            lines.push(`WARNING ${formatWarning(warning)}`);
        }
        lines.push("");
    }
    if (result.findings.length === 0) {
        lines.push("SlopLock found 0 findings");
        return lines.join("\n");
    }
    lines.push(`SlopLock found ${result.findings.length} findings`);
    lines.push("");
    for (const finding of result.findings) {
        lines.push(`${finding.severity.toUpperCase()} ${finding.ecosystem} ${finding.package}`);
        lines.push(`  Rule: ${finding.rule}`);
        lines.push(`  Source: ${formatSource(finding)}`);
        lines.push(`  Evidence: ${finding.evidence}`);
        lines.push(`  Action: ${finding.recommendation}`);
        lines.push("");
    }
    const summary = summarizeFindings(result.findings);
    if (summary.highestSeverity !== undefined) {
        lines.push(`Highest severity: ${summary.highestSeverity.toUpperCase()}`);
    }
    return lines.join("\n").trimEnd();
}
function formatSource(finding) {
    return finding.source.line === undefined
        ? finding.source.file
        : `${finding.source.file}:${finding.source.line}`;
}
function formatWarning(warning) {
    return warning.file === undefined
        ? warning.message
        : `${warning.file}: ${warning.message}`;
}
//# sourceMappingURL=text.js.map