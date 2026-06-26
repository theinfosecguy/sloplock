import { parse as parseToml } from "smol-toml";
import { normalizeCratesPackageName } from "../core/crates.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makeCratesReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

const dependencySectionNames = new Set([
  "dependencies",
  "dev-dependencies",
  "build-dependencies"
]);

export function parseCargoToml(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseTomlObject(options.content, options.sourceFile);
  const references = [
    ...parseDependencySections(parsed, options),
    ...parseWorkspaceDependencies(parsed, options),
    ...parseTargetDependencies(readRecord(parsed, "target"), options)
  ];

  return {
    references: dedupeReferences(references),
    warnings: []
  };
}

function parseDependencySections(
  table: Record<string, unknown>,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  return [...dependencySectionNames].flatMap((sectionName) =>
    parseDependencyTable(readRecord(table, sectionName), options)
  );
}

function parseWorkspaceDependencies(
  parsed: Record<string, unknown>,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  return parseDependencyTable(
    readRecord(readRecord(parsed, "workspace"), "dependencies"),
    options
  );
}

function parseTargetDependencies(
  targets: Record<string, unknown> | undefined,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (targets === undefined) {
    return [];
  }

  return Object.values(targets).flatMap((target) =>
    isRecord(target) ? parseDependencySections(target, options) : []
  );
}

function parseDependencyTable(
  dependencies: Record<string, unknown> | undefined,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (dependencies === undefined) {
    return [];
  }

  return Object.entries(dependencies).flatMap(([rawName, specifier]) =>
    referenceFromDependency(rawName, specifier, options)
  );
}

function referenceFromDependency(
  rawName: string,
  specifier: unknown,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (!isRegistryDependency(specifier)) {
    return [];
  }

  const packageName = packageNameFromDependency(rawName, specifier);
  if (packageName === undefined) {
    return [];
  }

  return [
    makeCratesReference({
      name: packageName,
      ...versionRangeInput(specifier),
      sourceFile: options.sourceFile,
      sourceKind: "manifest",
      isDirect: true,
      ...lineNumberInput(options.content, rawName)
    })
  ];
}

function isRegistryDependency(specifier: unknown): boolean {
  if (typeof specifier === "string") {
    return specifier.trim().length > 0;
  }

  if (!isRecord(specifier)) {
    return false;
  }

  if (
    specifier.path !== undefined ||
    specifier.git !== undefined ||
    specifier.workspace === true
  ) {
    return false;
  }

  if (specifier.registry !== undefined) {
    return false;
  }

  return typeof specifier.version === "string" && specifier.version.trim().length > 0;
}

function packageNameFromDependency(
  rawName: string,
  specifier: unknown
): string | undefined {
  if (isRecord(specifier) && typeof specifier.package === "string") {
    return normalizeCratesPackageName(specifier.package);
  }

  return normalizeCratesPackageName(rawName);
}

function versionRangeInput(specifier: unknown): { versionRange?: string } {
  if (typeof specifier === "string") {
    return { versionRange: specifier.trim() };
  }

  if (isRecord(specifier) && typeof specifier.version === "string") {
    return { versionRange: specifier.version.trim() };
  }

  return {};
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

function readRecord(
  input: Record<string, unknown> | undefined,
  key: string | undefined
): Record<string, unknown> | undefined {
  const value = key === undefined ? input : input?.[key];
  return isRecord(value) ? value : undefined;
}

function lineNumberInput(
  content: string,
  packageName: string
): { sourceLine?: number } {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const sourceLine = lineNumberForPattern(
    content,
    new RegExp(`^${escaped}\\s*=`, "mu")
  );
  return sourceLine === undefined ? {} : { sourceLine };
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
