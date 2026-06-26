import * as core from "@actions/core";
import * as github from "@actions/github";
import { scan } from "../core/scan.js";
import type { Finding } from "../core/types.js";
import { renderMarkdown, renderStepSummary } from "../reporting/markdown.js";
import { hasFailingFindings } from "../reporting/summary.js";
import { resolveChangedOnlyBaseRef } from "./base-ref.js";
import { upsertStickyComment } from "./comments.js";
import { readActionInputs } from "./inputs.js";

async function run(): Promise<void> {
  const inputs = readActionInputs();
  const baseRef = resolveChangedOnlyBaseRef({
    ...(inputs.base === undefined ? {} : { inputBase: inputs.base }),
    pullRequest: github.context.payload.pull_request
  });
  const result = await scan({
    rootDir: inputs.path,
    changedOnly: inputs.changedOnly,
    failOn: inputs.failOn,
    failClosed: inputs.failClosed,
    isCi: true,
    ...(baseRef === undefined ? {} : { baseRef }),
    ...(inputs.config === undefined ? {} : { configPath: inputs.config })
  });

  annotateFindings(result.findings);

  await core.summary.addRaw(renderStepSummary(result)).write();
  core.setOutput("findings", String(result.findings.length));
  core.setOutput("highest-severity", highestSeverityOutput(result.findings));

  if (inputs.comment && inputs.githubToken !== undefined) {
    try {
      await upsertStickyComment({
        token: inputs.githubToken,
        body: renderMarkdown(result)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      core.warning(`Unable to write SlopLock pull request comment: ${message}`);
    }
  }

  if (inputs.failClosed && result.registryFailures.length > 0) {
    core.setFailed("Registry checks failed and fail-closed is enabled.");
    return;
  }

  if (hasFailingFindings(result, result.failOn)) {
    core.setFailed(`SlopLock found findings at or above ${result.failOn}.`);
  }
}

function annotateFindings(findings: readonly Finding[]): void {
  for (const finding of findings) {
    const message = `${finding.rule}: ${finding.evidence} ${finding.recommendation}`;
    const properties =
      finding.source.line === undefined
        ? { file: finding.source.file }
        : { file: finding.source.file, startLine: finding.source.line };

    if (finding.severity === "high") {
      core.error(message, properties);
    } else {
      core.warning(message, properties);
    }
  }
}

function highestSeverityOutput(findings: readonly Finding[]): string {
  if (findings.some((finding) => finding.severity === "high")) {
    return "high";
  }

  if (findings.some((finding) => finding.severity === "medium")) {
    return "medium";
  }

  if (findings.some((finding) => finding.severity === "low")) {
    return "low";
  }

  return "";
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  core.setFailed(message);
});
