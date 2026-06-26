export function lineNumberForPattern(content, pattern) {
    const match = pattern.exec(content);
    if (match?.index === undefined) {
        return undefined;
    }
    return content.slice(0, match.index).split("\n").length;
}
export function makeNpmReference(input) {
    return {
        ecosystem: "npm",
        name: input.name,
        ...(input.versionRange === undefined
            ? {}
            : { versionRange: input.versionRange }),
        sourceFile: input.sourceFile,
        ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
        sourceKind: input.sourceKind,
        isDirect: input.isDirect
    };
}
export function makePypiReference(input) {
    return {
        ecosystem: "pypi",
        name: input.name,
        ...(input.versionRange === undefined
            ? {}
            : { versionRange: input.versionRange }),
        sourceFile: input.sourceFile,
        ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
        sourceKind: input.sourceKind,
        isDirect: input.isDirect
    };
}
export function makeGoReference(input) {
    return {
        ecosystem: "go",
        name: input.name,
        ...(input.versionRange === undefined
            ? {}
            : { versionRange: input.versionRange }),
        sourceFile: input.sourceFile,
        ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
        sourceKind: input.sourceKind,
        isDirect: input.isDirect
    };
}
export function makeCratesReference(input) {
    return {
        ecosystem: "crates",
        name: input.name,
        ...(input.versionRange === undefined
            ? {}
            : { versionRange: input.versionRange }),
        sourceFile: input.sourceFile,
        ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
        sourceKind: input.sourceKind,
        isDirect: input.isDirect
    };
}
export function isRecord(input) {
    return typeof input === "object" && input !== null && !Array.isArray(input);
}
export function toPosixPath(filePath) {
    return filePath.split("\\").join("/");
}
//# sourceMappingURL=common.js.map