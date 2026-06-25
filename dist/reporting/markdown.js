export const stickyCommentMarker = "<!-- sloplock-comment -->";
export function renderMarkdown(result) {
    const lines = [stickyCommentMarker, "", `SlopLock found ${result.findings.length} findings.`];
    if (result.warnings.length > 0) {
        lines.push("", "Warnings:");
        for (const warning of result.warnings) {
            lines.push(`- ${escapeMarkdown(formatWarning(warning))}`);
        }
    }
    if (result.findings.length === 0) {
        return lines.join("\n");
    }
    lines.push("", "| Severity | Ecosystem | Package | Rule | Evidence | Source |", "| --- | --- | --- | --- | --- | --- |");
    for (const finding of result.findings) {
        lines.push(`| ${escapeMarkdown(finding.severity.toUpperCase())} | ${escapeMarkdown(finding.ecosystem)} | ${escapeMarkdown(finding.package)} | ${escapeMarkdown(finding.rule)} | ${escapeMarkdown(finding.evidence)} | ${escapeMarkdown(formatSource(finding))} |`);
    }
    return lines.join("\n");
}
export function renderStepSummary(result) {
    return renderMarkdown(result).replace(`${stickyCommentMarker}\n\n`, "");
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
function escapeMarkdown(input) {
    return input.replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}
//# sourceMappingURL=markdown.js.map