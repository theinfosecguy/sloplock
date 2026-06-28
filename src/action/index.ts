import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { scan } from "../core/scan.js";
import type { ConfigWarning, Finding, RegistryPackageFailure } from "../core/types.js";
import { discoverDependencyFiles } from "../discovery/find-files.js";
import {
  renderActionFailureComment,
  renderActionFailureSummary,
  renderPullRequestComment,
  renderStepSummary
} from "../reporting/markdown.js";
import { hasFailingFindings } from "../reporting/summary.js";
import { resolveChangedOnlyBaseRef } from "./base-ref.js";
import { upsertStickyComment } from "./comments.js";
import { readActionInputs, type ActionInputs } from "./inputs.js";
import {
  buildCommentWarnings,
  buildSetupWarnings,
  type CommentStatus,
  withWarnings
} from "./setup-warnings.js";

const execFileAsync = promisify(execFile);

async function run(): Promise<void> {
  const inputs = readActionInputs();
  try {
    await runScan(inputs);
  } catch (error) {
    await reportActionFailure({ inputs, error });
  }
}

async function runScan(inputs: ActionInputs): Promise<void> {
  const rootDir = path.resolve(inputs.path);
  const hasPullRequest = github.context.payload.pull_request !== undefined;
  const baseRef = resolveChangedOnlyBaseRef({
    ...(inputs.base === undefined ? {} : { inputBase: inputs.base }),
    pullRequest: github.context.payload.pull_request
  });
  const result = await scan({
    rootDir,
    changedOnly: inputs.changedOnly,
    failOn: inputs.failOn,
    failClosed: inputs.failClosed,
    isCi: true,
    ...(baseRef === undefined ? {} : { baseRef }),
    ...(inputs.ecosystems === undefined ? {} : { ecosystems: inputs.ecosystems }),
    ...(inputs.config === undefined ? {} : { configPath: inputs.config })
  });

  annotateFindings(result.findings);
  annotateRegistryFailures(result.registryFailures);

  const setupWarnings = buildSetupWarnings({
    inputs,
    ...(baseRef === undefined ? {} : { baseRef }),
    hasPullRequest,
    dependencyFileCount: await dependencyFileCount(rootDir),
    isShallowRepository: await isShallowGitRepository(rootDir),
    result
  });
  const commentResult = await writePullRequestComment({
    inputs,
    result: withWarnings(result, setupWarnings)
  });
  const commentWarnings = buildCommentWarnings({
    inputs,
    status: commentResult.status
  });
  if (commentResult.errorMessage !== undefined) {
    core.debug(`Unable to write SlopLock pull request comment: ${commentResult.errorMessage}`);
  }

  const actionWarnings = [...setupWarnings, ...commentWarnings];
  annotateSetupWarnings(actionWarnings);
  const displayResult = withWarnings(result, actionWarnings);

  await core.summary.addRaw(renderStepSummary(displayResult)).write();
  core.setOutput("findings", String(result.findings.length));
  core.setOutput("highest-severity", highestSeverityOutput(result.findings));

  if (inputs.failClosed && result.registryFailures.length > 0) {
    core.setFailed("Registry checks failed and fail-closed is enabled.");
    return;
  }

  if (hasFailingFindings(result, result.failOn)) {
    core.setFailed(`SlopLock found findings at or above ${result.failOn}.`);
  }
}

async function writePullRequestComment(input: {
  inputs: ActionInputs;
  result: Awaited<ReturnType<typeof scan>>;
}): Promise<{ status: CommentStatus; errorMessage?: string }> {
  if (!input.inputs.comment || input.inputs.githubToken === undefined) {
    return { status: input.inputs.comment ? "failed" : "disabled" };
  }

  try {
    return {
      status: await upsertStickyComment({
        token: input.inputs.githubToken,
        body: renderPullRequestComment(input.result)
      })
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: "failed", errorMessage };
  }
}

async function reportActionFailure(input: {
  inputs: ActionInputs;
  error: unknown;
}): Promise<void> {
  const title = "SlopLock setup failed";
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  const rootDir = path.resolve(input.inputs.path);
  const warnings = await buildActionFailureWarnings({
    inputs: input.inputs,
    rootDir
  });
  const commentResult = await writeActionFailureComment({
    inputs: input.inputs,
    title,
    message,
    warnings
  });
  const actionWarnings = [
    ...warnings,
    ...buildCommentWarnings({
      inputs: input.inputs,
      status: commentResult.status
    })
  ];

  if (commentResult.errorMessage !== undefined) {
    core.debug(`Unable to write SlopLock pull request comment: ${commentResult.errorMessage}`);
  }

  annotateSetupWarnings(actionWarnings);
  await core.summary
    .addRaw(
      renderActionFailureSummary({
        title,
        message,
        warnings: actionWarnings
      })
    )
    .write();
  core.setOutput("findings", "0");
  core.setOutput("highest-severity", "");
  core.setFailed(message);
}

async function buildActionFailureWarnings(input: {
  inputs: ActionInputs;
  rootDir: string;
}): Promise<ConfigWarning[]> {
  const warnings: ConfigWarning[] = [];

  if (input.inputs.changedOnly && (await isShallowGitRepository(input.rootDir))) {
    warnings.push({
      message:
        "The checkout is shallow. Changed-only scans need base history; set `actions/checkout` `fetch-depth: 0`."
    });
  }

  return warnings;
}

async function writeActionFailureComment(input: {
  inputs: ActionInputs;
  title: string;
  message: string;
  warnings: readonly ConfigWarning[];
}): Promise<{ status: CommentStatus; errorMessage?: string }> {
  if (!input.inputs.comment || input.inputs.githubToken === undefined) {
    return { status: input.inputs.comment ? "failed" : "disabled" };
  }

  try {
    return {
      status: await upsertStickyComment({
        token: input.inputs.githubToken,
        body: renderActionFailureComment({
          title: input.title,
          message: input.message,
          warnings: input.warnings
        })
      })
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: "failed", errorMessage };
  }
}

async function dependencyFileCount(rootDir: string): Promise<number> {
  try {
    return (await discoverDependencyFiles(rootDir)).length;
  } catch {
    return 0;
  }
}

function annotateFindings(findings: readonly Finding[]): void {
  for (const finding of findings) {
    const message = `${finding.ecosystem} ${finding.package}: ${finding.evidence}`;
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

function annotateSetupWarnings(warnings: readonly ConfigWarning[]): void {
  for (const warning of warnings) {
    core.warning(warning.message);
  }
}

function annotateRegistryFailures(
  failures: readonly RegistryPackageFailure[]
): void {
  for (const failure of failures) {
    core.warning(
      `Registry check did not complete for ${failure.ecosystem} ${failure.name}: ${failure.message}`
    );
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

async function isShallowGitRepository(rootDir: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--is-shallow-repository"],
      { cwd: rootDir }
    );
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  core.setFailed(message);
});
