import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isSupportedDependencyFile, parseDependencyFile } from "../parsers/index.js";
import { toPosixPath } from "../parsers/common.js";
const ignoredDirectories = new Set([
    ".git",
    "node_modules",
    "dist",
    "coverage",
    ".next",
    ".turbo"
]);
export async function discoverDependencyFiles(rootDir) {
    const files = [];
    await walk(rootDir, rootDir, files);
    return files.sort();
}
export async function parseWorkspaceFiles(input) {
    const references = [];
    const warnings = [];
    const pendingFiles = [...new Set(input.files)];
    const parsedFiles = new Set();
    const includedRequirementFiles = new Set();
    while (pendingFiles.length > 0) {
        const relativeFile = pendingFiles.shift();
        if (relativeFile === undefined || parsedFiles.has(relativeFile)) {
            continue;
        }
        parsedFiles.add(relativeFile);
        const absoluteFile = path.join(input.rootDir, relativeFile);
        let content;
        try {
            content = await readFile(absoluteFile, "utf8");
        }
        catch {
            warnings.push({
                file: relativeFile,
                message: "Unable to read dependency file."
            });
            continue;
        }
        const parsed = parseDependencyFile({
            sourceFile: relativeFile,
            content,
            ...(includedRequirementFiles.has(relativeFile)
                ? { format: "python-requirements" }
                : {})
        });
        references.push(...parsed.references);
        warnings.push(...parsed.warnings);
        for (const includedFile of parsed.includedFiles ?? []) {
            const resolvedFile = resolveIncludedFile({
                rootDir: input.rootDir,
                sourceFile: relativeFile,
                includedFile
            });
            if (resolvedFile === undefined) {
                warnings.push({
                    file: relativeFile,
                    message: `Skipped requirement include outside scan root: ${includedFile}.`
                });
                continue;
            }
            if (!parsedFiles.has(resolvedFile)) {
                includedRequirementFiles.add(resolvedFile);
                pendingFiles.push(resolvedFile);
            }
        }
    }
    return { references, warnings };
}
function resolveIncludedFile(input) {
    if (path.isAbsolute(input.includedFile)) {
        return undefined;
    }
    const absoluteFile = path.resolve(input.rootDir, path.dirname(input.sourceFile), input.includedFile);
    const relativeFile = toPosixPath(path.relative(input.rootDir, absoluteFile));
    return relativeFile.startsWith("../") || relativeFile === ".."
        ? undefined
        : relativeFile;
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
        if (!entry.isFile()) {
            continue;
        }
        const absolutePath = path.join(currentDir, entry.name);
        const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
        if (isSupportedDependencyFile(relativePath)) {
            files.push(relativePath);
        }
    }
}
//# sourceMappingURL=find-files.js.map