import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { UsageError } from "../core/errors.js";
import { isSupportedDependencyFile, parseDependencyFile } from "../parsers/index.js";
import { toPosixPath } from "../parsers/common.js";
import { discoverDependencyFiles, parseWorkspaceFiles } from "./find-files.js";
const execFileAsync = promisify(execFile);
export async function parseChangedDependencyReferences(input) {
    const baseRef = input.baseRef ?? "origin/main";
    if (!(await isGitRepository(input.rootDir))) {
        throw new UsageError("--changed-only requires a git repository.");
    }
    const mergeBase = await getMergeBase(input.rootDir, baseRef);
    const changedFiles = await getChangedSupportedFiles(input.rootDir, mergeBase);
    if (changedFiles.length === 0) {
        return { references: [], warnings: [] };
    }
    const head = await parseWorkspaceFiles({
        rootDir: input.rootDir,
        files: changedFiles
    });
    const base = await parseBaseFiles({
        rootDir: input.rootDir,
        baseRef: mergeBase,
        files: changedFiles
    });
    return {
        references: diffDependencyReferences(base.references, head.references),
        warnings: [...head.warnings, ...base.warnings]
    };
}
function diffDependencyReferences(baseReferences, headReferences) {
    const basePackages = new Set(baseReferences.map(referenceKey));
    return headReferences.filter((reference) => !basePackages.has(referenceKey(reference)));
}
function referenceKey(reference) {
    return `${reference.ecosystem}:${reference.name}`;
}
async function parseBaseFiles(input) {
    const references = [];
    const warnings = [];
    const pendingFiles = [...new Set(input.files)];
    const parsedFiles = new Set();
    const includedRequirementFiles = new Set();
    while (pendingFiles.length > 0) {
        const file = pendingFiles.shift();
        if (file === undefined || parsedFiles.has(file)) {
            continue;
        }
        parsedFiles.add(file);
        const content = await readGitFile(input.rootDir, input.baseRef, file);
        if (content === undefined) {
            continue;
        }
        const parsed = parseDependencyFile({
            sourceFile: file,
            content,
            ...(includedRequirementFiles.has(file)
                ? { format: "python-requirements" }
                : {})
        });
        references.push(...parsed.references);
        warnings.push(...parsed.warnings);
        for (const includedFile of parsed.includedFiles ?? []) {
            const resolvedFile = resolveIncludedFile({
                rootDir: input.rootDir,
                sourceFile: file,
                includedFile
            });
            if (resolvedFile === undefined) {
                warnings.push({
                    file,
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
async function isGitRepository(rootDir) {
    try {
        await execGit(rootDir, ["rev-parse", "--is-inside-work-tree"]);
        return true;
    }
    catch {
        return false;
    }
}
async function getMergeBase(rootDir, baseRef) {
    try {
        const output = await execGit(rootDir, ["merge-base", baseRef, "HEAD"]);
        return output.trim();
    }
    catch {
        return baseRef;
    }
}
async function getChangedSupportedFiles(rootDir, baseRef) {
    try {
        const output = await execGit(rootDir, [
            "diff",
            "--name-only",
            "--diff-filter=AMRT",
            `${baseRef}...HEAD`
        ]);
        return output
            .split(/\r?\n/u)
            .map((file) => file.trim())
            .filter((file) => file.length > 0 && isSupportedDependencyFile(file))
            .sort();
    }
    catch {
        const files = await discoverDependencyFiles(rootDir);
        if (files.length === 0) {
            return [];
        }
        throw new UsageError(`Unable to compute changed files against ${baseRef}. Pass --base, fetch git history with actions/checkout fetch-depth: 0, or run a full scan.`);
    }
}
async function readGitFile(rootDir, ref, file) {
    try {
        return await execGit(rootDir, ["show", `${ref}:${file}`]);
    }
    catch {
        return undefined;
    }
}
async function execGit(rootDir, args) {
    const { stdout } = await execFileAsync("git", [...args], {
        cwd: rootDir,
        maxBuffer: 10 * 1024 * 1024
    });
    return stdout;
}
//# sourceMappingURL=git.js.map