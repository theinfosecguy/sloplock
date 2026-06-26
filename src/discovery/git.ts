import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { UsageError } from "../core/errors.js";
import type { ConfigWarning, DependencyReference } from "../core/types.js";
import { isSupportedDependencyFile, parseDependencyFile } from "../parsers/index.js";
import { discoverDependencyFiles, parseWorkspaceFiles } from "./find-files.js";

const execFileAsync = promisify(execFile);

export async function parseChangedDependencyReferences(input: {
  rootDir: string;
  baseRef?: string;
}): Promise<{
  references: DependencyReference[];
  warnings: ConfigWarning[];
}> {
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

function diffDependencyReferences(
  baseReferences: readonly DependencyReference[],
  headReferences: readonly DependencyReference[]
): DependencyReference[] {
  const basePackages = new Set(baseReferences.map(referenceKey));
  return headReferences.filter((reference) => !basePackages.has(referenceKey(reference)));
}

function referenceKey(reference: DependencyReference): string {
  return `${reference.ecosystem}:${reference.name}`;
}

async function parseBaseFiles(input: {
  rootDir: string;
  baseRef: string;
  files: readonly string[];
}): Promise<{
  references: DependencyReference[];
  warnings: ConfigWarning[];
}> {
  const references: DependencyReference[] = [];
  const warnings: ConfigWarning[] = [];

  for (const file of input.files) {
    const content = await readGitFile(input.rootDir, input.baseRef, file);
    if (content === undefined) {
      continue;
    }

    const parsed = parseDependencyFile({ sourceFile: file, content });
    references.push(...parsed.references);
    warnings.push(...parsed.warnings);
  }

  return { references, warnings };
}

async function isGitRepository(rootDir: string): Promise<boolean> {
  try {
    await execGit(rootDir, ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

async function getMergeBase(rootDir: string, baseRef: string): Promise<string> {
  try {
    const output = await execGit(rootDir, ["merge-base", baseRef, "HEAD"]);
    return output.trim();
  } catch {
    return baseRef;
  }
}

async function getChangedSupportedFiles(
  rootDir: string,
  baseRef: string
): Promise<string[]> {
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
  } catch {
    const files = await discoverDependencyFiles(rootDir);
    if (files.length === 0) {
      return [];
    }

    throw new UsageError(
      `Unable to compute changed files against ${baseRef}. Pass --base, fetch git history with actions/checkout fetch-depth: 0, or run a full scan.`
    );
  }
}

async function readGitFile(
  rootDir: string,
  ref: string,
  file: string
): Promise<string | undefined> {
  try {
    return await execGit(rootDir, ["show", `${ref}:${file}`]);
  } catch {
    return undefined;
  }
}

async function execGit(rootDir: string, args: readonly string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", [...args], {
    cwd: rootDir,
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout;
}
