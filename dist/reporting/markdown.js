export const stickyCommentMarker = "<!-- sloplock-comment -->";
export function renderMarkdown(result) {
    return renderStepSummary(result);
}
export function renderPullRequestComment(result) {
    const lines = [
        stickyCommentMarker,
        "",
        "## SlopLock dependency review",
        "",
        summarySentence(result),
        "",
        "| Metric | Value |",
        "| --- | --- |",
        `| Findings | ${result.findings.length} |`,
        `| Public registry dependencies checked | ${result.scannedDependencies} |`,
        `| Fail threshold | ${result.failOn.toUpperCase()} |`,
        `| Warnings | ${result.warnings.length} |`,
        `| Registry failures | ${result.registryFailures.length} |`
    ];
    if (result.findings.length > 0) {
        lines.push("", "### Findings");
        result.findings.forEach((finding, index) => {
            lines.push("", `${index + 1}. **${finding.severity.toUpperCase()}** ${escapeMarkdownText(finding.ecosystem)} package ${formatInlineCode(finding.package)}`, `   - Source: ${formatInlineCode(formatSource(finding))}`, `   - Why blocked: ${escapeMarkdownText(finding.evidence)}`, `   - Fix: ${escapeMarkdownText(finding.recommendation)}`, "   - If this is private or internal, add an allow entry with an expiry:", "", "```yaml", "allow:", `  - ecosystem: ${finding.ecosystem}`, `    package: ${finding.package}`, "    reason: private package confirmed by the owning team", "    expires: YYYY-MM-DD", "```");
        });
    }
    appendRegistryFailureSection(lines, result.registryFailures);
    appendWarningSection(lines, result.warnings);
    if (result.findings.length > 0) {
        lines.push("", "SlopLock only checks package existence and first-published cooldown. It is not an SCA or vulnerability scanner.");
    }
    return lines.join("\n");
}
export function renderStepSummary(result) {
    const lines = [
        "# SlopLock dependency review",
        "",
        summarySentence(result),
        "",
        "| Metric | Value |",
        "| --- | --- |",
        `| Findings | ${result.findings.length} |`,
        `| Public registry dependencies checked | ${result.scannedDependencies} |`,
        `| Fail threshold | ${result.failOn.toUpperCase()} |`,
        `| Warnings | ${result.warnings.length} |`,
        `| Registry failures | ${result.registryFailures.length} |`
    ];
    appendFindingTable(lines, result.findings);
    appendRegistryFailureSection(lines, result.registryFailures);
    appendWarningSection(lines, result.warnings);
    return lines.join("\n");
}
export function renderActionFailureComment(input) {
    return [stickyCommentMarker, "", ...renderActionFailureLines(input)].join("\n");
}
export function renderActionFailureSummary(input) {
    return renderActionFailureLines(input).join("\n");
}
function appendFindingTable(lines, findings) {
    if (findings.length === 0) {
        lines.push("", "No blocked dependency names were found.");
        return;
    }
    lines.push("", "## Findings", "", "| Severity | Ecosystem | Package | Rule | Evidence | Source |", "| --- | --- | --- | --- | --- | --- |");
    for (const finding of findings) {
        lines.push(`| ${escapeMarkdown(finding.severity.toUpperCase())} | ${escapeMarkdown(finding.ecosystem)} | ${escapeMarkdown(finding.package)} | ${escapeMarkdown(finding.rule)} | ${escapeMarkdown(finding.evidence)} | ${escapeMarkdown(formatSource(finding))} |`);
    }
}
function appendRegistryFailureSection(lines, failures) {
    if (failures.length === 0) {
        return;
    }
    lines.push("", "## Registry checks that did not complete", "", "| Ecosystem | Package | Status | Retryable | Message |", "| --- | --- | --- | --- | --- |");
    for (const failure of failures) {
        lines.push(`| ${escapeMarkdown(failure.ecosystem)} | ${escapeMarkdown(failure.name)} | ${escapeMarkdown(formatStatus(failure.status))} | ${failure.retryable ? "yes" : "no"} | ${escapeMarkdown(failure.message)} |`);
    }
}
function appendWarningSection(lines, warnings) {
    if (warnings.length === 0) {
        return;
    }
    lines.push("", "## Warnings");
    for (const warning of warnings) {
        lines.push(`- ${escapeMarkdownText(formatWarning(warning))}`);
    }
}
function summarySentence(result) {
    if (result.findings.length === 0) {
        if (result.scannedDependencies === 0) {
            return "No public registry dependency names were found to review for this pull request.";
        }
        return "No SlopLock findings were found for this pull request.";
    }
    return `SlopLock found ${result.findings.length} dependency ${plural(result.findings.length, "name")} that ${result.findings.length === 1 ? "needs" : "need"} review before merge.`;
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
function formatStatus(status) {
    return status.replace(/_/gu, " ");
}
function escapeMarkdown(input) {
    return input.replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}
function escapeMarkdownText(input) {
    return input
        .replace(/([\\`*_{}[\]()#+\-.!|>])/gu, "\\$1")
        .replace(/\r?\n/gu, " ");
}
function formatInlineCode(input) {
    return `\`${input.replace(/`/gu, "'")}\``;
}
function plural(count, singular) {
    return count === 1 ? singular : `${singular}s`;
}
function renderActionFailureLines(input) {
    const lines = [
        `# ${input.title}`,
        "",
        escapeMarkdownText(input.message)
    ];
    appendWarningSection(lines, input.warnings ?? []);
    return lines;
}
//# sourceMappingURL=markdown.js.map