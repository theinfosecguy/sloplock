import { isRegistryVersionRange, normalizeNpmPackageName, packageNameFromNpmAlias } from "../core/npm.js";
import { isRecord, lineNumberForPattern, makeNpmReference } from "./common.js";
const dependencySections = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies"
];
export function parsePackageJson(options) {
    const warnings = [];
    const parsed = parseJsonObject(options.content, options.sourceFile);
    const references = [];
    for (const section of dependencySections) {
        const dependencies = parsed[section];
        if (!isRecord(dependencies)) {
            continue;
        }
        for (const [rawName, rawVersion] of Object.entries(dependencies)) {
            if (typeof rawVersion !== "string" || !isRegistryVersionRange(rawVersion)) {
                continue;
            }
            const packageName = packageNameFromNpmAlias(rawVersion) ?? normalizeNpmPackageName(rawName);
            if (packageName === undefined) {
                warnings.push(`Skipped invalid npm package name ${rawName}.`);
                continue;
            }
            references.push(makeNpmReference({
                name: packageName,
                versionRange: rawVersion,
                sourceFile: options.sourceFile,
                sourceKind: "manifest",
                isDirect: true,
                ...lineNumberInput(options.content, rawName)
            }));
        }
    }
    return { references, warnings };
}
function parseJsonObject(content, sourceFile) {
    try {
        const parsed = JSON.parse(content);
        if (!isRecord(parsed)) {
            throw new Error("expected a JSON object");
        }
        return parsed;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON in ${sourceFile}: ${message}`);
    }
}
function lineNumberForPackage(content, packageName) {
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    return lineNumberForPattern(content, new RegExp(`"${escaped}"\\s*:`, "u"));
}
function lineNumberInput(content, packageName) {
    const sourceLine = lineNumberForPackage(content, packageName);
    return sourceLine === undefined ? {} : { sourceLine };
}
//# sourceMappingURL=package-json.js.map