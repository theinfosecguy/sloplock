import {
  isRegistryVersionRange,
  normalizeNpmPackageName,
  packageNameFromNpmAlias
} from "../core/npm.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makeNpmReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies"
] as const;

export function parsePackageJson(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const warnings: string[] = [];
  const parsed = parseJsonObject(options.content, options.sourceFile);
  const references: DependencyReference[] = [];

  for (const section of dependencySections) {
    const dependencies = parsed[section];
    if (!isRecord(dependencies)) {
      continue;
    }

    for (const [rawName, rawVersion] of Object.entries(dependencies)) {
      if (typeof rawVersion !== "string" || !isRegistryVersionRange(rawVersion)) {
        continue;
      }

      const packageName =
        packageNameFromNpmAlias(rawVersion) ?? normalizeNpmPackageName(rawName);

      if (packageName === undefined) {
        warnings.push(`Skipped invalid npm package name ${rawName}.`);
        continue;
      }

      references.push(
        makeNpmReference({
          name: packageName,
          versionRange: rawVersion,
          sourceFile: options.sourceFile,
          sourceKind: "manifest",
          isDirect: true,
          ...lineNumberInput(options.content, rawName)
        })
      );
    }
  }

  return { references, warnings };
}

function parseJsonObject(content: string, sourceFile: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) {
      throw new Error("expected a JSON object");
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${sourceFile}: ${message}`);
  }
}

function lineNumberForPackage(
  content: string,
  packageName: string
): number | undefined {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return lineNumberForPattern(content, new RegExp(`"${escaped}"\\s*:`, "u"));
}

function lineNumberInput(
  content: string,
  packageName: string
): { sourceLine?: number } {
  const sourceLine = lineNumberForPackage(content, packageName);
  return sourceLine === undefined ? {} : { sourceLine };
}
