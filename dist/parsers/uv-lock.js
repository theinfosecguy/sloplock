import { parse as parseToml } from "smol-toml";
import { isPublicPypiRegistryUrl, normalizePypiPackageName } from "../core/pypi.js";
import { isRecord, lineNumberForPattern, makePypiReference } from "./common.js";
export function parseUvLock(options) {
    const parsed = parseTomlObject(options.content, options.sourceFile);
    return {
        references: dedupeReferences(parsePackages(parsed.package, options)),
        warnings: []
    };
}
function parsePackages(packages, options) {
    if (!Array.isArray(packages)) {
        return [];
    }
    return packages.flatMap((metadata) => {
        if (!isPublicPypiPackage(metadata)) {
            return [];
        }
        const packageName = normalizePypiPackageName(metadata.name);
        if (packageName === undefined) {
            return [];
        }
        return [
            makePypiReference({
                name: packageName,
                ...(typeof metadata.version === "string"
                    ? { versionRange: metadata.version }
                    : {}),
                sourceFile: options.sourceFile,
                sourceKind: "lockfile",
                isDirect: false,
                ...lineNumberInput(options.content, metadata.name)
            })
        ];
    });
}
function isPublicPypiPackage(metadata) {
    if (!isRecord(metadata) || typeof metadata.name !== "string") {
        return false;
    }
    const source = metadata.source;
    return (isRecord(source) &&
        typeof source.registry === "string" &&
        isPublicPypiRegistryUrl(source.registry));
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
function lineNumberInput(content, packageName) {
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const sourceLine = lineNumberForPattern(content, new RegExp(`^name\\s*=\\s*["']${escaped}["']`, "mu"));
    return sourceLine === undefined ? {} : { sourceLine };
}
function dedupeReferences(references) {
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
//# sourceMappingURL=uv-lock.js.map