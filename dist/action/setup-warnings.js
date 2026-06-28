export function buildSetupWarnings(input) {
    const warnings = [];
    if (input.inputs.changedOnly &&
        input.baseRef === undefined &&
        !input.hasPullRequest) {
        warnings.push({
            message: "Changed-only mode is running without a pull request base or explicit `base` input. SlopLock will rely on its default base; run on `pull_request` or set `base` for predictable PR gating."
        });
    }
    if (input.inputs.changedOnly && input.isShallowRepository) {
        warnings.push({
            message: "The checkout is shallow. Changed-only scans need base history; set `actions/checkout` `fetch-depth: 0`."
        });
    }
    if (input.dependencyFileCount === 0) {
        warnings.push({
            message: `No supported dependency files were found under ${formatInlineCode(input.inputs.path)}. Confirm the Action \`path\` points at the repository root or a supported subdirectory.`
        });
        return warnings;
    }
    if (!input.inputs.changedOnly && input.result.scannedDependencies === 0) {
        warnings.push({
            message: "Supported dependency files were found, but SlopLock found no public registry dependency names to check. If this is unexpected, review private/local dependency declarations and supported file formats."
        });
    }
    return warnings;
}
export function buildCommentWarnings(input) {
    if (!input.inputs.comment) {
        return [];
    }
    switch (input.status) {
        case "disabled":
        case "created":
        case "updated":
            return [];
        case "skipped":
            return [
                {
                    message: "Pull request comment was skipped because this run is not attached to a pull request. Use the `pull_request` event or set `comment: false`."
                }
            ];
        case "failed":
            return [
                {
                    message: "Pull request comment could not be written. Grant `pull-requests: write` or set `comment: false`; results are still available in annotations and the step summary."
                }
            ];
    }
}
export function withWarnings(result, warnings) {
    if (warnings.length === 0) {
        return result;
    }
    return {
        ...result,
        warnings: [...warnings, ...result.warnings]
    };
}
function formatInlineCode(input) {
    return `\`${input.replace(/`/gu, "'")}\``;
}
//# sourceMappingURL=setup-warnings.js.map