const nugetPackageNamePattern = /^[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*$/u;
const nugetOrgPackageIdLimit = 100;
export function normalizeNugetPackageName(packageName) {
    const trimmed = packageName.trim();
    if (trimmed.length === 0 ||
        trimmed.length > nugetOrgPackageIdLimit ||
        trimmed.includes("$(") ||
        !nugetPackageNamePattern.test(trimmed)) {
        return undefined;
    }
    return trimmed.toLowerCase();
}
export function isNugetOrgSourceUrl(input) {
    try {
        const url = new URL(input.trim());
        const hostname = url.hostname.toLowerCase();
        const pathname = url.pathname.replace(/\/+$/u, "").toLowerCase();
        return ((hostname === "api.nuget.org" && pathname === "/v3/index.json") ||
            ((hostname === "www.nuget.org" || hostname === "nuget.org") &&
                pathname === "/api/v2"));
    }
    catch {
        return false;
    }
}
export function matchesNugetPackagePattern(packageName, pattern) {
    const normalizedName = normalizeNugetPackageName(packageName);
    if (normalizedName === undefined) {
        return false;
    }
    const normalizedPattern = pattern.trim().toLowerCase();
    if (normalizedPattern.length === 0) {
        return false;
    }
    if (normalizedPattern === "*") {
        return true;
    }
    const escapedPattern = normalizedPattern
        .replace(/[.+?^${}()|[\]\\]/gu, "\\$&")
        .replace(/\*/gu, ".*");
    return new RegExp(`^${escapedPattern}$`, "iu").test(normalizedName);
}
//# sourceMappingURL=nuget.js.map