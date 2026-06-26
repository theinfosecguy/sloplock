const goModuleFirstPathElementPattern = /^[a-z0-9][a-z0-9.-]*\.[a-z0-9.-]+$/iu;
const goModulePathPattern = /^[A-Za-z0-9._~!$&'()*+,;=:@/-]+$/u;
const localModulePathSuffixes = new Set(["internal", "invalid", "local", "localhost", "test"]);
export function normalizeGoModulePath(input) {
    const modulePath = input.trim();
    if (modulePath.length === 0 ||
        modulePath.includes("://") ||
        modulePath.includes("\\") ||
        modulePath.includes("@") ||
        modulePath.startsWith(".") ||
        modulePath.startsWith("/") ||
        modulePath.endsWith("/") ||
        modulePath.includes("//") ||
        !goModulePathPattern.test(modulePath)) {
        return undefined;
    }
    const firstPathElement = modulePath.split("/")[0];
    if (firstPathElement === undefined ||
        !goModuleFirstPathElementPattern.test(firstPathElement) ||
        localModulePathSuffixes.has(firstPathElement.split(".").at(-1)?.toLowerCase() ?? "")) {
        return undefined;
    }
    return modulePath;
}
export function escapeGoProxyPath(input) {
    return input
        .split("/")
        .map((segment) => encodeURIComponent(caseEncode(segment)))
        .join("/");
}
export function goPrivatePatternsFromEnvironment(env = process.env) {
    return [
        ...splitGoPrivatePatternList(env.GOPRIVATE),
        ...splitGoPrivatePatternList(env.GONOPROXY)
    ];
}
export function splitGoPrivatePatternList(input) {
    if (input === undefined) {
        return [];
    }
    return input
        .split(",")
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern.length > 0);
}
export function matchesGoPrivateModulePattern(modulePath, pattern) {
    const trimmed = pattern.trim();
    if (trimmed.length === 0) {
        return false;
    }
    if (!hasGlobSyntax(trimmed)) {
        return modulePath === trimmed || modulePath.startsWith(`${trimmed}/`);
    }
    const matcher = globPatternToRegExp(trimmed);
    return modulePrefixes(modulePath).some((prefix) => matcher.test(prefix));
}
function caseEncode(input) {
    return input.replace(/[A-Z]/gu, (letter) => `!${letter.toLowerCase()}`);
}
function hasGlobSyntax(input) {
    return /[*?[\]]/u.test(input);
}
function modulePrefixes(modulePath) {
    const parts = modulePath.split("/");
    return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}
function globPatternToRegExp(pattern) {
    let source = "^";
    for (const character of pattern) {
        if (character === "*") {
            source += "[^/]*";
            continue;
        }
        if (character === "?") {
            source += "[^/]";
            continue;
        }
        source += escapeRegExp(character);
    }
    source += "$";
    return new RegExp(source, "u");
}
function escapeRegExp(input) {
    return input.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}
//# sourceMappingURL=go.js.map