import { normalizeNugetPackageName } from "../core/nuget.js";
import { isRecord, lineNumberForPattern, makeNugetReference } from "./common.js";
import { parseXmlElements, xmlAttribute, xmlChildText } from "./xml.js";
export function parseMsBuildProject(options) {
    return {
        references: dedupeReferences(packageReferenceElements(options).flatMap((element) => referenceFromMsBuildElement(element, options))),
        warnings: []
    };
}
export function parseDirectoryPackagesProps(options) {
    return {
        references: dedupeReferences(packageVersionElements(options).flatMap((element) => referenceFromMsBuildElement(element, options))),
        warnings: []
    };
}
export function parsePackagesConfig(options) {
    const references = parseXmlElements(options.content)
        .filter((element) => element.name.toLowerCase() === "package")
        .flatMap((element) => {
        const rawName = xmlAttribute(element, "id");
        const packageName = rawName === undefined ? undefined : normalizeNugetPackageName(rawName);
        if (packageName === undefined) {
            return [];
        }
        return [
            makeNugetReference({
                name: packageName,
                ...versionRangeInput(xmlAttribute(element, "version")),
                sourceFile: options.sourceFile,
                sourceLine: element.sourceLine,
                sourceKind: "manifest",
                isDirect: true
            })
        ];
    });
    return { references: dedupeReferences(references), warnings: [] };
}
export function parsePackagesLockJson(options) {
    const parsed = parseJsonObject(options.content, options.sourceFile);
    const dependencies = parsed.dependencies;
    if (!isRecord(dependencies)) {
        return { references: [], warnings: [] };
    }
    const references = [];
    for (const frameworkDependencies of Object.values(dependencies)) {
        if (!isRecord(frameworkDependencies)) {
            continue;
        }
        for (const [rawName, metadata] of Object.entries(frameworkDependencies)) {
            const reference = lockReferenceFromEntry(rawName, metadata, options);
            if (reference !== undefined) {
                references.push(reference);
            }
        }
    }
    return { references: dedupeReferences(references), warnings: [] };
}
function packageReferenceElements(options) {
    return parseXmlElements(options.content).filter((element) => {
        const name = element.name.toLowerCase();
        return name === "packagereference" || name === "globalpackagereference";
    });
}
function packageVersionElements(options) {
    return parseXmlElements(options.content).filter((element) => {
        const name = element.name.toLowerCase();
        return name === "packageversion" || name === "globalpackagereference";
    });
}
function referenceFromMsBuildElement(element, options) {
    const rawName = xmlAttribute(element, "include") ?? xmlAttribute(element, "update");
    const packageName = rawName === undefined ? undefined : normalizeNugetPackageName(rawName);
    if (packageName === undefined) {
        return [];
    }
    return [
        makeNugetReference({
            name: packageName,
            ...versionRangeInput(xmlAttribute(element, "version") ??
                xmlAttribute(element, "versionoverride") ??
                xmlChildText(element, "Version")),
            sourceFile: options.sourceFile,
            sourceLine: element.sourceLine,
            sourceKind: "manifest",
            isDirect: true
        })
    ];
}
function lockReferenceFromEntry(rawName, metadata, options) {
    if (!isRecord(metadata)) {
        return undefined;
    }
    const packageName = normalizeNugetPackageName(rawName);
    if (packageName === undefined || packageLockEntryIsProject(metadata)) {
        return undefined;
    }
    const rawType = readString(metadata.type);
    const isDirect = rawType === undefined ||
        rawType.toLowerCase() === "direct" ||
        rawType.toLowerCase() === "centraltransitive";
    const versionRange = readString(metadata.requested) ?? readString(metadata.resolved);
    return makeNugetReference({
        name: packageName,
        ...versionRangeInput(versionRange),
        sourceFile: options.sourceFile,
        ...lineNumberInput(options.content, rawName),
        sourceKind: "lockfile",
        isDirect
    });
}
function packageLockEntryIsProject(metadata) {
    const type = readString(metadata.type)?.toLowerCase();
    return type === "project" || type === "externalproject";
}
function versionRangeInput(versionRange) {
    const trimmed = versionRange?.trim();
    return trimmed === undefined || trimmed.length === 0 ? {} : { versionRange: trimmed };
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
function readString(input) {
    return typeof input === "string" && input.trim().length > 0
        ? input.trim()
        : undefined;
}
function lineNumberInput(content, packageName) {
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const sourceLine = lineNumberForPattern(content, new RegExp(`^\\s*"${escaped}"\\s*:`, "imu"));
    return sourceLine === undefined ? {} : { sourceLine };
}
function dedupeReferences(references) {
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
//# sourceMappingURL=nuget.js.map