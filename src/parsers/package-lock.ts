import {
  isRegistryLockfileSpecifier,
  normalizeNpmPackageName
} from "../core/npm.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  makeNpmReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parsePackageLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseJsonObject(options.content, options.sourceFile);
  const references = [
    ...parsePackagesObject(parsed.packages, options.sourceFile),
    ...parseDependenciesObject(parsed.dependencies, options.sourceFile)
  ];

  return {
    references: dedupeReferences(references),
    warnings: []
  };
}

function parsePackagesObject(
  packages: unknown,
  sourceFile: string
): DependencyReference[] {
  if (!isRecord(packages)) {
    return [];
  }

  const references: DependencyReference[] = [];

  for (const [packagePath, metadata] of Object.entries(packages)) {
    if (packagePath === "" || !isRecord(metadata)) {
      continue;
    }

    const packageName = packageNameFromNodeModulesPath(packagePath);
    if (packageName === undefined) {
      continue;
    }

    if (
      typeof metadata.resolved === "string" &&
      !isRegistryLockfileSpecifier(metadata.resolved)
    ) {
      continue;
    }

    references.push(
      makeNpmReference({
        name: packageName,
        sourceFile,
        sourceKind: "lockfile",
        isDirect: false
      })
    );
  }

  return references;
}

function parseDependenciesObject(
  dependencies: unknown,
  sourceFile: string
): DependencyReference[] {
  if (!isRecord(dependencies)) {
    return [];
  }

  const references: DependencyReference[] = [];

  for (const [rawName, metadata] of Object.entries(dependencies)) {
    if (!isPackageLockDependencyRegistryEntry(metadata)) {
      if (isRecord(metadata)) {
        references.push(...parseDependenciesObject(metadata.dependencies, sourceFile));
      }
      continue;
    }

    const packageName = normalizeNpmPackageName(rawName);
    if (packageName !== undefined) {
      references.push(
        makeNpmReference({
          name: packageName,
          sourceFile,
          sourceKind: "lockfile",
          isDirect: false
        })
      );
    }

    if (isRecord(metadata)) {
      references.push(...parseDependenciesObject(metadata.dependencies, sourceFile));
    }
  }

  return references;
}

function isPackageLockDependencyRegistryEntry(metadata: unknown): boolean {
  if (!isRecord(metadata)) {
    return true;
  }

  for (const field of ["version", "resolved"]) {
    const specifier = metadata[field];
    if (
      typeof specifier === "string" &&
      !isRegistryLockfileSpecifier(specifier)
    ) {
      return false;
    }
  }

  return true;
}

function packageNameFromNodeModulesPath(packagePath: string): string | undefined {
  const parts = packagePath.split("node_modules/");
  const last = parts.at(-1);
  if (last === undefined || last.length === 0) {
    return undefined;
  }

  const [first, second] = last.split("/");
  const name =
    first?.startsWith("@") === true && second !== undefined
      ? `${first}/${second}`
      : first;

  return name === undefined ? undefined : normalizeNpmPackageName(name);
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

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
