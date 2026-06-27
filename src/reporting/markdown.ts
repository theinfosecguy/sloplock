import type {
  Finding,
  RegistryPackageFailure,
  ScanResult
} from "../core/types.js";

export const stickyCommentMarker = "<!-- sloplock-comment -->";

export function renderMarkdown(result: ScanResult): string {
  return renderStepSummary(result);
}

export function renderPullRequestComment(result: ScanResult): string {
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
    `| Scanned dependencies | ${result.scannedDependencies} |`,
    `| Fail threshold | ${result.failOn.toUpperCase()} |`,
    `| Warnings | ${result.warnings.length} |`,
    `| Registry failures | ${result.registryFailures.length} |`
  ];

  if (result.findings.length > 0) {
    lines.push("", "### Findings");
    result.findings.forEach((finding, index) => {
      lines.push(
        "",
        `${index + 1}. **${finding.severity.toUpperCase()}** ${escapeMarkdownText(
          finding.ecosystem
        )} package ${formatInlineCode(finding.package)}`,
        `   - Source: ${formatInlineCode(formatSource(finding))}`,
        `   - Why blocked: ${escapeMarkdownText(finding.evidence)}`,
        `   - Fix: ${escapeMarkdownText(finding.recommendation)}`,
        "   - If this is private or internal, add an allow entry with an expiry:",
        "",
        "```yaml",
        "allow:",
        `  - ecosystem: ${finding.ecosystem}`,
        `    package: ${finding.package}`,
        "    reason: private package confirmed by the owning team",
        "    expires: YYYY-MM-DD",
        "```"
      );
    });
  }

  appendRegistryFailureSection(lines, result.registryFailures);
  appendWarningSection(lines, result.warnings);

  if (result.findings.length > 0) {
    lines.push(
      "",
      "SlopLock only checks package existence and first-published cooldown. It is not an SCA or vulnerability scanner."
    );
  }

  return lines.join("\n");
}

export function renderStepSummary(result: ScanResult): string {
  const lines = [
    "# SlopLock dependency review",
    "",
    summarySentence(result),
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Findings | ${result.findings.length} |`,
    `| Scanned dependencies | ${result.scannedDependencies} |`,
    `| Fail threshold | ${result.failOn.toUpperCase()} |`,
    `| Warnings | ${result.warnings.length} |`,
    `| Registry failures | ${result.registryFailures.length} |`
  ];

  appendFindingTable(lines, result.findings);
  appendRegistryFailureSection(lines, result.registryFailures);
  appendWarningSection(lines, result.warnings);

  return lines.join("\n");
}

function appendFindingTable(lines: string[], findings: readonly Finding[]): void {
  if (findings.length === 0) {
    lines.push("", "No blocked dependency names were found.");
    return;
  }

  lines.push(
    "",
    "## Findings",
    "",
    "| Severity | Ecosystem | Package | Rule | Evidence | Source |",
    "| --- | --- | --- | --- | --- | --- |"
  );

  for (const finding of findings) {
    lines.push(
      `| ${escapeMarkdown(finding.severity.toUpperCase())} | ${escapeMarkdown(
        finding.ecosystem
      )} | ${escapeMarkdown(finding.package)} | ${escapeMarkdown(
        finding.rule
      )} | ${escapeMarkdown(finding.evidence)} | ${escapeMarkdown(
        formatSource(finding)
      )} |`
    );
  }
}

function appendRegistryFailureSection(
  lines: string[],
  failures: readonly RegistryPackageFailure[]
): void {
  if (failures.length === 0) {
    return;
  }

  lines.push(
    "",
    "## Registry checks that did not complete",
    "",
    "| Ecosystem | Package | Status | Retryable | Message |",
    "| --- | --- | --- | --- | --- |"
  );

  for (const failure of failures) {
    lines.push(
      `| ${escapeMarkdown(failure.ecosystem)} | ${escapeMarkdown(
        failure.name
      )} | ${escapeMarkdown(formatStatus(failure.status))} | ${
        failure.retryable ? "yes" : "no"
      } | ${escapeMarkdown(failure.message)} |`
    );
  }
}

function appendWarningSection(
  lines: string[],
  warnings: readonly { message: string; file?: string }[]
): void {
  if (warnings.length === 0) {
    return;
  }

  lines.push("", "## Warnings");
  for (const warning of warnings) {
    lines.push(`- ${escapeMarkdownText(formatWarning(warning))}`);
  }
}

function summarySentence(result: ScanResult): string {
  if (result.findings.length === 0) {
    return "No SlopLock findings were found for this pull request.";
  }

  return `SlopLock found ${result.findings.length} dependency ${plural(
    result.findings.length,
    "name"
  )} that ${result.findings.length === 1 ? "needs" : "need"} review before merge.`;
}

function formatSource(finding: Finding): string {
  return finding.source.line === undefined
    ? finding.source.file
    : `${finding.source.file}:${finding.source.line}`;
}

function formatWarning(warning: { message: string; file?: string }): string {
  return warning.file === undefined
    ? warning.message
    : `${warning.file}: ${warning.message}`;
}

function formatStatus(status: RegistryPackageFailure["status"]): string {
  return status.replace(/_/gu, " ");
}

function escapeMarkdown(input: string): string {
  return input.replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}

function escapeMarkdownText(input: string): string {
  return input
    .replace(/([\\`*_{}[\]()#+\-.!|>])/gu, "\\$1")
    .replace(/\r?\n/gu, " ");
}

function formatInlineCode(input: string): string {
  return `\`${input.replace(/`/gu, "'")}\``;
}

function plural(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}
