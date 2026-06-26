import path from "node:path";
import type { ConfigWarning, DependencyReference } from "../core/types.js";
import type { ParsedDependencyFile } from "./common.js";
import { parsePackageJson } from "./package-json.js";
import { parsePackageLock } from "./package-lock.js";
import { parsePnpmLock } from "./pnpm-lock.js";
import { parsePyproject } from "./pyproject.js";
import { parsePythonRequirements } from "./python-requirements.js";
import { parseYarnLock } from "./yarn-lock.js";

const supportedFileNames = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pyproject.toml",
  "requirements.txt",
  "yarn.lock"
]);

export function isSupportedDependencyFile(filePath: string): boolean {
  return supportedFileNames.has(path.basename(filePath));
}

export function parseDependencyFile(input: {
  sourceFile: string;
  content: string;
}): {
  references: DependencyReference[];
  warnings: ConfigWarning[];
} {
  const fileName = path.basename(input.sourceFile);
  const parsed = parseByFileName(fileName, input.sourceFile, input.content);

  return {
    references: parsed.references,
    warnings: parsed.warnings.map((message) => ({
      file: input.sourceFile,
      message
    }))
  };
}

function parseByFileName(
  fileName: string,
  sourceFile: string,
  content: string
): ParsedDependencyFile {
  switch (fileName) {
    case "package.json":
      return parsePackageJson({ sourceFile, content });
    case "package-lock.json":
      return parsePackageLock({ sourceFile, content });
    case "pnpm-lock.yaml":
      return parsePnpmLock({ sourceFile, content });
    case "pyproject.toml":
      return parsePyproject({ sourceFile, content });
    case "requirements.txt":
      return parsePythonRequirements({ sourceFile, content });
    case "yarn.lock":
      return parseYarnLock({ sourceFile, content });
    default:
      return { references: [], warnings: [] };
  }
}
