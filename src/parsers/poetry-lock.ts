import { parse as parseToml } from "smol-toml";
import {
  isPublicPypiRegistryUrl,
  normalizePypiPackageName
} from "../core/pypi.js";
import {
  isRecord,
  lineNumberForPattern,
  makePypiReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parsePoetryLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseTomlObject(options.content, options.sourceFile);
  const packages = parsed.package;

  if (!Array.isArray(packages)) {
    return { references: [], warnings: [] };
  }

  const references = dedupeReferences(
    packages.flatMap((entry) => referenceFromPackageEntry(entry, options))
  );

  return { references, warnings: [] };
}

function referenceFromPackageEntry(
  entry: unknown,
  options: ParseDependencyFileOptions
): ReturnType<typeof makePypiReference>[] {
  if (!isRecord(entry) || !isPublicPypiSource(readRecord(entry, "source"))) {
    return [];
  }

  const rawName = entry.name;
  if (typeof rawName !== "string") {
    return [];
  }

  const packageName = normalizePypiPackageName(rawName);
  if (packageName === undefined) {
    return [];
  }

  return [
    makePypiReference({
      name: packageName,
      ...versionRangeInput(entry.version),
      sourceFile: options.sourceFile,
      sourceKind: "lockfile",
      isDirect: false,
      ...lineNumberInput(options.content, rawName)
    })
  ];
}

function isPublicPypiSource(source: Record<string, unknown> | undefined): boolean {
  if (source === undefined) {
    return true;
  }

  const sourceUrl = readString(source, "url");
  if (sourceUrl !== undefined) {
    return isPublicPypiRegistryUrl(sourceUrl);
  }

  return readString(source, "type")?.toLowerCase() === "pypi";
}

function versionRangeInput(version: unknown): { versionRange?: string } {
  return typeof version === "string" && version.trim().length > 0
    ? { versionRange: version.trim() }
    : {};
}

function readRecord(
  input: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = input[key];
  return isRecord(value) ? value : undefined;
}

function readString(
  input: Record<string, unknown>,
  key: string
): string | undefined {
  const value = input[key];
  return typeof value === "string" ? value : undefined;
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
  references: readonly ReturnType<typeof makePypiReference>[]
): ReturnType<typeof makePypiReference>[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
