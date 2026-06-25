import { parse as parseYaml } from "yaml";
import {
  normalizeNpmPackageName,
  packageNameFromNpmAlias
} from "../core/npm.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  makeNpmReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parsePnpmLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseYamlObject(options.content, options.sourceFile);
  const references = [
    ...parseImporters(parsed.importers, options.sourceFile),
    ...parsePackages(parsed.packages, options.sourceFile)
  ];

  return {
    references: dedupeReferences(references),
    warnings: []
  };
}

function parseImporters(
  importers: unknown,
  sourceFile: string
): DependencyReference[] {
  if (!isRecord(importers)) {
    return [];
  }

  const references: DependencyReference[] = [];

  for (const importer of Object.values(importers)) {
    if (!isRecord(importer)) {
      continue;
    }

    for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
      const dependencies = importer[field];
      if (!isRecord(dependencies)) {
        continue;
      }

      for (const [rawName, rawMetadata] of Object.entries(dependencies)) {
        const packageName = packageNameFromPnpmDependency(rawName, rawMetadata);
        if (packageName === undefined) {
          continue;
        }

        references.push(
          makeNpmReference({
            name: packageName,
            sourceFile,
            sourceKind: "lockfile",
            isDirect: true
          })
        );
      }
    }
  }

  return references;
}

function parsePackages(
  packages: unknown,
  sourceFile: string
): DependencyReference[] {
  if (!isRecord(packages)) {
    return [];
  }

  const references: DependencyReference[] = [];

  for (const packageKey of Object.keys(packages)) {
    const packageName = packageNameFromPnpmPackageKey(packageKey);
    if (packageName === undefined) {
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

function packageNameFromPnpmDependency(
  rawName: string,
  metadata: unknown
): string | undefined {
  if (isRecord(metadata)) {
    const version = metadata.version;
    if (typeof version === "string") {
      const aliasPackage = packageNameFromNpmAlias(version);
      if (aliasPackage !== undefined) {
        return aliasPackage;
      }
    }
  }

  if (typeof metadata === "string") {
    const aliasPackage = packageNameFromNpmAlias(metadata);
    if (aliasPackage !== undefined) {
      return aliasPackage;
    }
  }

  return normalizeNpmPackageName(rawName);
}

function packageNameFromPnpmPackageKey(packageKey: string): string | undefined {
  const key = packageKey.startsWith("/") ? packageKey.slice(1) : packageKey;

  if (key.startsWith("@")) {
    const slashParts = key.split("/");
    const scope = slashParts[0];
    const packageName = slashParts[1];
    if (scope !== undefined && packageName !== undefined && slashParts.length >= 3) {
      return normalizeNpmPackageName(`${scope}/${packageName}`);
    }

    return normalizeNpmPackageName(key.match(/^(@[^/]+\/[^@/]+)@/u)?.[1] ?? "");
  }

  const slashName = key.match(/^([^/]+)\//u)?.[1];
  if (slashName !== undefined) {
    return normalizeNpmPackageName(slashName);
  }

  return normalizeNpmPackageName(key.match(/^([^@]+)@/u)?.[1] ?? "");
}

function parseYamlObject(content: string, sourceFile: string): Record<string, unknown> {
  try {
    const parsed: unknown = parseYaml(content) ?? {};
    if (!isRecord(parsed)) {
      throw new Error("expected a YAML mapping");
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid YAML in ${sourceFile}: ${message}`);
  }
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
