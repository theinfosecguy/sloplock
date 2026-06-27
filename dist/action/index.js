import * as core from "@actions/core";
import * as github from "@actions/github";
import { scan } from "../core/scan.js";
import { renderPullRequestComment, renderStepSummary } from "../reporting/markdown.js";
import { hasFailingFindings } from "../reporting/summary.js";
import { resolveChangedOnlyBaseRef } from "./base-ref.js";
import { upsertStickyComment } from "./comments.js";
import { readActionInputs } from "./inputs.js";
async function run() {
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
        ...(inputs.ecosystems === undefined ? {} : { ecosystems: inputs.ecosystems }),
        ...(inputs.config === undefined ? {} : { configPath: inputs.config })
    });
    annotateFindings(result.findings);
    annotateRegistryFailures(result.registryFailures);
    await core.summary.addRaw(renderStepSummary(result)).write();
    core.setOutput("findings", String(result.findings.length));
    core.setOutput("highest-severity", highestSeverityOutput(result.findings));
    if (inputs.comment && inputs.githubToken !== undefined) {
        try {
            await upsertStickyComment({
                token: inputs.githubToken,
                body: renderPullRequestComment(result)
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            core.debug(`Unable to write SlopLock pull request comment: ${message}`);
            core.warning("Unable to write SlopLock pull request comment. Grant `pull-requests: write` or set `comment: false`; scan results are still available in annotations and the step summary.");
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
function annotateFindings(findings) {
    for (const finding of findings) {
        const message = `${finding.ecosystem} ${finding.package}: ${finding.evidence}`;
        const properties = finding.source.line === undefined
            ? { file: finding.source.file }
            : { file: finding.source.file, startLine: finding.source.line };
        if (finding.severity === "high") {
            core.error(message, properties);
        }
        else {
            core.warning(message, properties);
        }
    }
}
function annotateRegistryFailures(failures) {
    for (const failure of failures) {
        core.warning(`Registry check did not complete for ${failure.ecosystem} ${failure.name}: ${failure.message}`);
    }
}
function highestSeverityOutput(findings) {
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
void run().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
//# sourceMappingURL=index.js.map