import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isSupportedDependencyFile, parseDependencyFile } from "../parsers/index.js";
import { toPosixPath } from "../parsers/common.js";
import type { ConfigWarning, DependencyReference } from "../core/types.js";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".next",
  ".turbo"
]);

export async function discoverDependencyFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  await walk(rootDir, rootDir, files);
  return files.sort();
}

export async function parseWorkspaceFiles(input: {
  rootDir: string;
  files: readonly string[];
}): Promise<{
  references: DependencyReference[];
  warnings: ConfigWarning[];
}> {
  const references: DependencyReference[] = [];
  const warnings: ConfigWarning[] = [];

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

async function walk(
  rootDir: string,
  currentDir: string,
  files: string[]
): Promise<void> {
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
