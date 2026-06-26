import { parse as parseToml } from "smol-toml";
import { normalizePypiPackageName } from "../core/pypi.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makePypiReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

const nonRegistrySourceTypes = new Set([
  "directory",
  "editable",
  "file",
  "git",
  "path",
  "url",
  "virtual"
]);
const nonRegistrySourceFields = [
  "directory",
  "editable",
  "file",
  "git",
  "member",
  "path",
  "url",
  "virtual",
  "workspace"
];

export function parsePdmLock(
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

    const packageName = normalizePypiPackageName(metadata.name);
    if (packageName === undefined) {
      return [];
    }

    return [
      makePypiReference({
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

  if (metadata.editable === true) {
    return false;
  }

  for (const field of nonRegistrySourceFields) {
    if (typeof metadata[field] === "string") {
      return false;
    }

    if (metadata[field] === true) {
      return false;
    }
  }

  const source = metadata.source;
  if (!isRecord(source)) {
    return true;
  }

  for (const field of nonRegistrySourceFields) {
    if (typeof source[field] === "string") {
      return false;
    }

    if (source[field] === true) {
      return false;
    }
  }

  const type = source.type;
  return !(
    typeof type === "string" &&
    nonRegistrySourceTypes.has(type.trim().toLowerCase())
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
