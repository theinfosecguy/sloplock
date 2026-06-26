import path from "node:path";
import type { ConfigWarning, DependencyReference } from "../core/types.js";
import type { ParsedDependencyFile } from "./common.js";
import { parsePackageJson } from "./package-json.js";
import { parsePackageLock } from "./package-lock.js";
import { parsePnpmLock } from "./pnpm-lock.js";
import { parsePyproject } from "./pyproject.js";
import { parsePythonRequirements } from "./python-requirements.js";
import { parseUvLock } from "./uv-lock.js";
import { parseYarnLock } from "./yarn-lock.js";

const supportedFileNames = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pyproject.toml",
  "requirements.txt",
  "uv.lock",
  "yarn.lock"
]);

export function isSupportedDependencyFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return supportedFileNames.has(fileName) || isPythonRequirementsFile(fileName);
}

export function parseDependencyFile(input: {
  sourceFile: string;
  content: string;
  format?: "python-requirements";
}): {
  references: DependencyReference[];
  warnings: ConfigWarning[];
  includedFiles?: string[];
} {
  const parsed =
    input.format === "python-requirements"
      ? parsePythonRequirements({
          sourceFile: input.sourceFile,
          content: input.content
        })
      : parseByFileName(
          path.basename(input.sourceFile),
          input.sourceFile,
          input.content
        );

  return {
    references: parsed.references,
    warnings: parsed.warnings.map((message) => ({
      file: input.sourceFile,
      message
    })),
    ...(parsed.includedFiles === undefined ? {} : { includedFiles: parsed.includedFiles })
  };
}

function parseByFileName(
  fileName: string,
  sourceFile: string,
  content: string
): ParsedDependencyFile {
  if (isPythonRequirementsFile(fileName)) {
    return parsePythonRequirements({ sourceFile, content });
  }

  switch (fileName) {
    case "package.json":
      return parsePackageJson({ sourceFile, content });
    case "package-lock.json":
      return parsePackageLock({ sourceFile, content });
    case "pnpm-lock.yaml":
      return parsePnpmLock({ sourceFile, content });
    case "pyproject.toml":
      return parsePyproject({ sourceFile, content });
    case "uv.lock":
      return parseUvLock({ sourceFile, content });
    case "yarn.lock":
      return parseYarnLock({ sourceFile, content });
    default:
      return { references: [], warnings: [] };
  }
}

function isPythonRequirementsFile(fileName: string): boolean {
  return (
    /^requirements(?:[-_.][A-Za-z0-9_.-]+)?\.txt$/u.test(fileName) ||
    /^[A-Za-z0-9_.-]+[-_.]requirements\.txt$/u.test(fileName) ||
    /^constraints(?:[-_.][A-Za-z0-9_.-]+)?\.txt$/u.test(fileName) ||
    /^[A-Za-z0-9_.-]+[-_.]constraints\.txt$/u.test(fileName)
  );
}
