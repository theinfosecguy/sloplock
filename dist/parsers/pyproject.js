import { parse as parseToml } from "smol-toml";
import { normalizePypiPackageName } from "../core/pypi.js";
import { isRecord, lineNumberForPattern, makePypiReference } from "./common.js";
import { parsePythonRequirementString } from "./python-requirements.js";
export function parsePyproject(options) {
    const parsed = parseTomlObject(options.content, options.sourceFile);
    const references = [
        ...parseProjectDependencies(parsed, options),
        ...parsePoetryDependencies(parsed, options)
    ];
    return { references, warnings: [] };
}
function parseProjectDependencies(parsed, options) {
    const project = readRecord(parsed, "project");
    if (project === undefined) {
        return [];
    }
    return [
        ...parseRequirementArray(project.dependencies, options),
        ...parseOptionalDependencyGroups(readRecord(project, "optional-dependencies"), options)
    ];
}
function parseOptionalDependencyGroups(groups, options) {
    if (groups === undefined) {
        return [];
    }
    return Object.values(groups).flatMap((group) => parseRequirementArray(group, options));
}
function parsePoetryDependencies(parsed, options) {
    const poetry = readRecord(readRecord(parsed, "tool"), "poetry");
    if (poetry === undefined) {
        return [];
    }
    return [
        ...parsePoetryDependencyTable(readRecord(poetry, "dependencies"), options),
        ...parsePoetryDependencyGroups(readRecord(poetry, "group"), options)
    ];
}
function parsePoetryDependencyGroups(groups, options) {
    if (groups === undefined) {
        return [];
    }
    return Object.values(groups).flatMap((group) => parsePoetryDependencyTable(readRecord(isRecord(group) ? group : undefined, "dependencies"), options));
}
function parseRequirementArray(input, options) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input.flatMap((requirement) => {
        if (typeof requirement !== "string") {
            return [];
        }
        return parsePythonRequirementString({
            requirement,
            sourceFile: options.sourceFile,
            ...lineNumberInput(options.content, requirement)
        }).references;
    });
}
function parsePoetryDependencyTable(table, options) {
    if (table === undefined) {
        return [];
    }
    return Object.entries(table).flatMap(([name, specifier]) => {
        if (name === "python" || isLocalPoetrySpecifier(specifier)) {
            return [];
        }
        const packageName = normalizePypiPackageName(name);
        if (packageName === undefined) {
            return [];
        }
        return [
            makePypiReference({
                name: packageName,
                ...versionRangeInput(specifier),
                sourceFile: options.sourceFile,
                sourceKind: "manifest",
                isDirect: true,
                ...lineNumberInput(options.content, name)
            })
        ];
    });
}
function versionRangeInput(specifier) {
    if (typeof specifier === "string" && specifier.trim().length > 0) {
        return { versionRange: specifier.trim() };
    }
    if (isRecord(specifier) && typeof specifier.version === "string") {
        return { versionRange: specifier.version.trim() };
    }
    return {};
}
function isLocalPoetrySpecifier(specifier) {
    if (!isRecord(specifier)) {
        return false;
    }
    return ["path", "git", "url"].some((field) => specifier[field] !== undefined);
}
function readRecord(input, key) {
    const value = key === undefined ? input : input?.[key];
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
function lineNumberInput(content, pattern) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const sourceLine = lineNumberForPattern(content, new RegExp(escaped, "u"));
    return sourceLine === undefined ? {} : { sourceLine };
}
//# sourceMappingURL=pyproject.js.map