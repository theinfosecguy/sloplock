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
    for (const relativeFile of input.files) {
        const absoluteFile = path.join(input.rootDir, relativeFile);
        const parsed = parseDependencyFile({
            sourceFile: relativeFile,
            content: await readFile(absoluteFile, "utf8")
        });
        references.push(...parsed.references);
        warnings.push(...parsed.warnings);
    }
    return { references, warnings };
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