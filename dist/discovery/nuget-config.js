import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isNugetOrgSourceUrl, normalizeNugetPackageName } from "../core/nuget.js";
import { toPosixPath } from "../parsers/common.js";
import { parseXmlElements, xmlAttribute } from "../parsers/xml.js";
const ignoredDirectories = new Set([
    ".git",
    "node_modules",
    "dist",
    "coverage",
    ".next",
    ".turbo"
]);
export async function filterNugetReferencesBySourcePolicy(input) {
    const nugetReferences = input.references.filter((reference) => reference.ecosystem === "nuget");
    if (nugetReferences.length === 0) {
        return { references: [...input.references], warnings: [] };
    }
    const policy = await loadNugetConfigPolicy(input.rootDir);
    if (policy.mode === "default") {
        return { references: [...input.references], warnings: [] };
    }
    const nonNugetReferences = input.references.filter((reference) => reference.ecosystem !== "nuget");
    if (policy.mode === "skip-all") {
        return {
            references: nonNugetReferences,
            warnings: [
                {
                    ...(policy.file === undefined ? {} : { file: policy.file }),
                    message: policy.reason
                }
            ]
        };
    }
    const filteredNugetReferences = nugetReferences.filter((reference) => policy.patterns.some((pattern) => nugetPatternMatches(pattern, reference.name)));
    const skippedCount = nugetReferences.length - filteredNugetReferences.length;
    const warnings = skippedCount === 0
        ? []
        : [
            {
                ...(policy.file === undefined ? {} : { file: policy.file }),
                message: `Skipped ${skippedCount} NuGet package reference${skippedCount === 1 ? "" : "s"} not mapped to NuGet.org.`
            }
        ];
    return {
        references: [...nonNugetReferences, ...filteredNugetReferences],
        warnings
    };
}
async function loadNugetConfigPolicy(rootDir) {
    const files = await discoverNugetConfigFiles(rootDir);
    if (files.length === 0) {
        return { mode: "default" };
    }
    const configs = await Promise.all(files.map(async (file) => ({
        file,
        content: await readFile(path.join(rootDir, file), "utf8")
    })));
    const parsedConfigs = configs.map((config) => ({
        file: config.file,
        parsed: parseNugetConfig(config.content)
    }));
    const mappedConfig = parsedConfigs.find((config) => config.parsed.packageSourceMappings.length > 0);
    if (mappedConfig !== undefined) {
        const nugetSourceKeys = new Set(mappedConfig.parsed.packageSources
            .filter((source) => isNugetOrgSourceUrl(source.value))
            .map((source) => source.key));
        const patterns = mappedConfig.parsed.packageSourceMappings
            .filter((mapping) => nugetSourceKeys.has(mapping.sourceKey))
            .flatMap((mapping) => mapping.patterns)
            .sort();
        return patterns.length === 0
            ? {
                mode: "skip-all",
                file: mappedConfig.file,
                reason: "Skipped NuGet package references because NuGet.config packageSourceMapping does not map any package to NuGet.org."
            }
            : { mode: "mapped", file: mappedConfig.file, patterns };
    }
    const clearingConfig = parsedConfigs.find((config) => {
        if (!config.parsed.clearsPackageSources) {
            return false;
        }
        const hasNugetOrg = config.parsed.packageSources.some((source) => isNugetOrgSourceUrl(source.value));
        const hasPrivateSource = config.parsed.packageSources.some((source) => !isNugetOrgSourceUrl(source.value));
        return !hasNugetOrg || hasPrivateSource;
    });
    if (clearingConfig !== undefined) {
        return {
            mode: "skip-all",
            file: clearingConfig.file,
            reason: "Skipped NuGet package references because NuGet.config uses non-NuGet.org package sources without packageSourceMapping."
        };
    }
    return { mode: "default" };
}
async function discoverNugetConfigFiles(rootDir) {
    const files = [];
    await walk(rootDir, rootDir, files);
    return files.sort();
}
async function walk(rootDir, currentDir, files) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) {
                await walk(rootDir, path.join(currentDir, entry.name), files);
            }
            continue;
        }
        if (!entry.isFile() || !/^nuget\.config$/iu.test(entry.name)) {
            continue;
        }
        files.push(toPosixPath(path.relative(rootDir, path.join(currentDir, entry.name))));
    }
}
function parseNugetConfig(content) {
    const elements = parseXmlElements(content);
    const packageSources = elements
        .filter((element) => element.name.toLowerCase() === "add")
        .filter((element) => isInsideSection(content, element, "packageSources"))
        .flatMap((element) => {
        const key = xmlAttribute(element, "key");
        const value = xmlAttribute(element, "value");
        return key === undefined || value === undefined ? [] : [{ key, value }];
    });
    const packageSourceMappings = elements
        .filter((element) => element.name.toLowerCase() === "packagesource")
        .map((element) => ({
        sourceKey: xmlAttribute(element, "key") ?? "",
        patterns: packagePatternsForSource(element)
    }))
        .filter((mapping) => mapping.sourceKey.length > 0);
    return {
        packageSources,
        packageSourceMappings,
        clearsPackageSources: elements.some((element) => element.name.toLowerCase() === "clear" &&
            isInsideSection(content, element, "packageSources"))
    };
}
function packagePatternsForSource(sourceElement) {
    return parseXmlElements(sourceElement.innerContent)
        .filter((element) => element.name.toLowerCase() === "package")
        .flatMap((element) => {
        const pattern = xmlAttribute(element, "pattern");
        return pattern === undefined ? [] : [pattern.trim().toLowerCase()];
    });
}
function isInsideSection(content, element, sectionName) {
    const elementOffset = lineOffset(content, element.sourceLine);
    const sectionOpen = new RegExp(`<${sectionName}\\b[^>]*>`, "igu");
    for (const match of content.matchAll(sectionOpen)) {
        const start = match.index;
        if (start > elementOffset) {
            continue;
        }
        const end = closingElementOffset(content, start, sectionName);
        if (elementOffset < end) {
            return true;
        }
    }
    return false;
}
function closingElementOffset(content, start, elementName) {
    const pattern = new RegExp(`</${elementName}\\s*>`, "iu");
    const match = pattern.exec(content.slice(start));
    return match?.index === undefined ? content.length : start + match.index;
}
function lineOffset(content, lineNumber) {
    if (lineNumber <= 1) {
        return 0;
    }
    let line = 1;
    for (let index = 0; index < content.length; index += 1) {
        if (content[index] === "\n") {
            line += 1;
            if (line === lineNumber) {
                return index + 1;
            }
        }
    }
    return content.length;
}
function nugetPatternMatches(pattern, packageName) {
    const normalizedName = normalizeNugetPackageName(packageName);
    if (normalizedName === undefined) {
        return false;
    }
    if (pattern === "*") {
        return true;
    }
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/gu, "\\$&").replace(/\*/gu, ".*");
    return new RegExp(`^${escaped}$`, "iu").test(normalizedName);
}
//# sourceMappingURL=nuget-config.js.map