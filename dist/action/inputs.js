import * as core from "@actions/core";
export function readActionInputs() {
    const base = core.getInput("base");
    const config = core.getInput("config");
    const ecosystem = core.getInput("ecosystem");
    const githubToken = core.getInput("github-token");
    return {
        path: core.getInput("path") || ".",
        failOn: readFailOn(core.getInput("fail-on") || "high"),
        ...ecosystemsInput(ecosystem),
        changedOnly: core.getBooleanInput("changed-only"),
        ...(base.trim().length === 0 ? {} : { base }),
        ...(config.trim().length === 0 ? {} : { config }),
        comment: core.getBooleanInput("comment"),
        ...(githubToken.trim().length === 0 ? {} : { githubToken }),
        failClosed: core.getBooleanInput("fail-closed")
    };
}
function ecosystemsInput(input) {
    const trimmed = input.trim();
    if (trimmed.length === 0 || trimmed === "all") {
        return {};
    }
    if (trimmed === "crates" ||
        trimmed === "go" ||
        trimmed === "npm" ||
        trimmed === "packagist" ||
        trimmed === "pypi") {
        return { ecosystems: [trimmed] };
    }
    throw new Error("Action input ecosystem must be all, crates, go, npm, packagist, or pypi.");
}
function readFailOn(input) {
    if (input === "medium" || input === "high") {
        return input;
    }
    throw new Error("Action input fail-on must be medium or high.");
}
//# sourceMappingURL=inputs.js.map