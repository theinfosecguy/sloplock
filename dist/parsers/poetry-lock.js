import { parse as parseToml } from "smol-toml";
import { normalizePypiPackageName } from "../core/pypi.js";
import { isRecord, makePypiReference } from "./common.js";
export function parsePoetryLock(options) {
    const parsed = parseTomlObject(options.content, options.sourceFile);
    const packages = parsed.package;
    if (!Array.isArray(packages)) {
        return { references: [], warnings: [] };
    }
    const references = packages.flatMap((entry) => referenceFromPackageEntry(entry, options.sourceFile));
    return { references, warnings: [] };
}
function referenceFromPackageEntry(entry, sourceFile) {
    if (!isRecord(entry) || isNonRegistrySource(readRecord(entry, "source"))) {
        return [];
    }
    const rawName = entry.name;
    if (typeof rawName !== "string") {
        return [];
    }
    const packageName = normalizePypiPackageName(rawName);
    if (packageName === undefined) {
        return [];
    }
    return [
        makePypiReference({
            name: packageName,
            ...versionRangeInput(entry.version),
            sourceFile,
            sourceKind: "lockfile",
            isDirect: false
        })
    ];
}
function isNonRegistrySource(source) {
    if (source === undefined) {
        return false;
    }
    const type = source.type;
    return (type === "directory" ||
        type === "file" ||
        type === "git" ||
        type === "url");
}
function versionRangeInput(version) {
    return typeof version === "string" && version.trim().length > 0
        ? { versionRange: version.trim() }
        : {};
}
function readRecord(input, key) {
    const value = input[key];
    return isRecord(value) ? value : undefined;
}
function parseTomlObject(content, sourceFile) {
    try {
        const parsed = parseToml(content);
        if (!isRecord(parsed)) {
            throw new Error("expected a TOML table");
        }
        return parsed;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid TOML in ${sourceFile}: ${message}`);
    }
}
//# sourceMappingURL=poetry-lock.js.map