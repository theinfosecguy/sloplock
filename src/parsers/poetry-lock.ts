import { parse as parseToml } from "smol-toml";
import { normalizePypiPackageName } from "../core/pypi.js";
import {
  isRecord,
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

  const references = packages.flatMap((entry) =>
    referenceFromPackageEntry(entry, options.sourceFile)
  );

  return { references, warnings: [] };
}

function referenceFromPackageEntry(
  entry: unknown,
  sourceFile: string
): ReturnType<typeof makePypiReference>[] {
  if (!isRecord(entry) || isNonRegistrySource(readRecord(entry, "source"))) {
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
      sourceFile,
      sourceKind: "lockfile",
      isDirect: false
    })
  ];
}

function isNonRegistrySource(source: Record<string, unknown> | undefined): boolean {
  if (source === undefined) {
    return false;
  }

  const type = source.type;
  return (
    type === "directory" ||
    type === "file" ||
    type === "git" ||
    type === "url"
  );
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
