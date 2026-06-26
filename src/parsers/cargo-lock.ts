import { parse as parseToml } from "smol-toml";
import {
  isDefaultCratesRegistrySource,
  normalizeCratesPackageName
} from "../core/crates.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makeCratesReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parseCargoLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseTomlObject(options.content, options.sourceFile);

  return {
    references: dedupeReferences(parsePackages(parsed.package, options)),
    warnings: []
  };
}

function parsePackages(
  packages: unknown,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (!Array.isArray(packages)) {
    return [];
  }

  return packages.flatMap((metadata) => {
    if (!isRegistryPackage(metadata)) {
      return [];
    }

    const packageName = normalizeCratesPackageName(metadata.name);
    if (packageName === undefined) {
      return [];
    }

    return [
      makeCratesReference({
        name: packageName,
        ...(typeof metadata.version === "string"
          ? { versionRange: metadata.version }
          : {}),
        sourceFile: options.sourceFile,
        sourceKind: "lockfile",
        isDirect: false,
        ...lineNumberInput(options.content, metadata.name)
      })
    ];
  });
}

function isRegistryPackage(
  metadata: unknown
): metadata is { name: string; version?: unknown } {
  if (!isRecord(metadata) || typeof metadata.name !== "string") {
    return false;
  }

  return (
    typeof metadata.source === "string" &&
    isDefaultCratesRegistrySource(metadata.source)
  );
}

function parseTomlObject(
  content: string,
  sourceFile: string
): Record<string, unknown> {
  try {
    const parsed: unknown = parseToml(content);
    if (!isRecord(parsed)) {
      throw new Error("expected a TOML table");
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid TOML in ${sourceFile}: ${message}`);
  }
}

function lineNumberInput(
  content: string,
  packageName: string
): { sourceLine?: number } {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const sourceLine = lineNumberForPattern(
    content,
    new RegExp(`^name\\s*=\\s*["']${escaped}["']`, "mu")
  );
  return sourceLine === undefined ? {} : { sourceLine };
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
