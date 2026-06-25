const npmPackageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
export function normalizeNpmPackageName(name) {
    const normalized = name.trim().toLowerCase();
    if (normalized.length === 0 ||
        normalized.length > 214 ||
        normalized.includes(" ") ||
        !npmPackageNamePattern.test(normalized)) {
        return undefined;
    }
    return normalized;
}
export function packageNameFromNpmAlias(versionRange) {
    if (!versionRange.startsWith("npm:")) {
        return undefined;
    }
    const aliasTarget = versionRange.slice("npm:".length);
    const name = aliasTarget.startsWith("@")
        ? aliasTarget.match(/^(@[^/]+\/[^@/]+)/u)?.[1]
        : aliasTarget.match(/^([^@]+)/u)?.[1];
    return name === undefined ? undefined : normalizeNpmPackageName(name);
}
export function isRegistryVersionRange(versionRange) {
    const trimmed = versionRange.trim();
    if (trimmed.length === 0) {
        return true;
    }
    if (trimmed.startsWith("npm:")) {
        return true;
    }
    const nonRegistryPrefixes = [
        "file:",
        "link:",
        "workspace:",
        "portal:",
        "patch:",
        "git:",
        "git+",
        "github:",
        "http:",
        "https:"
    ];
    return !nonRegistryPrefixes.some((prefix) => trimmed.startsWith(prefix));
}
export function isRegistryLockfileSpecifier(specifier) {
    const trimmed = specifier.trim();
    if (trimmed.length === 0) {
        return false;
    }
    if (hasNonRegistryProtocol(trimmed)) {
        return false;
    }
    if (trimmed.startsWith("http:") || trimmed.startsWith("https:")) {
        return isPublicNpmRegistryUrl(trimmed);
    }
    return true;
}
export function hasNonRegistryProtocol(specifier) {
    const trimmed = specifier.trim();
    const nonRegistryPrefixes = [
        "file:",
        "link:",
        "workspace:",
        "portal:",
        "patch:",
        "git:",
        "git+",
        "github:"
    ];
    return nonRegistryPrefixes.some((prefix) => trimmed.startsWith(prefix));
}
export function isPublicNpmRegistryUrl(specifier) {
    try {
        const url = new URL(specifier);
        return url.hostname === "registry.npmjs.org";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=npm.js.map