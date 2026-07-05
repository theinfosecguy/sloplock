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
export function readActionFailureInputs() {
    const base = safeInput("base");
    const config = safeInput("config");
    const githubToken = safeInput("github-token");
    return {
        path: safeInput("path") || ".",
        failOn: "high",
        changedOnly: safeBooleanInput("changed-only", true),
        ...(base.trim().length === 0 ? {} : { base }),
        ...(config.trim().length === 0 ? {} : { config }),
        comment: safeBooleanInput("comment", true),
        ...(githubToken.trim().length === 0 ? {} : { githubToken }),
        failClosed: safeBooleanInput("fail-closed", false)
    };
}
export function ecosystemsInput(input) {
    const trimmed = input.trim();
    if (trimmed.length === 0 || trimmed === "all") {
        return {};
    }
    if (trimmed === "crates" ||
        trimmed === "go" ||
        trimmed === "maven" ||
        trimmed === "npm" ||
        trimmed === "nuget" ||
        trimmed === "packagist" ||
        trimmed === "pypi" ||
        trimmed === "rubygems") {
        return { ecosystems: [trimmed] };
    }
    throw new Error("Action input ecosystem must be all, crates, go, maven, npm, nuget, packagist, pypi, or rubygems.");
}
function readFailOn(input) {
    if (input === "medium" || input === "high") {
        return input;
    }
    throw new Error("Action input fail-on must be medium or high.");
}
function safeInput(name) {
    try {
        return core.getInput(name);
    }
    catch {
        return "";
    }
}
function safeBooleanInput(name, fallback) {
    try {
        return core.getBooleanInput(name);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=inputs.js.map