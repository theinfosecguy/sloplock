import {
  isComposerPlatformPackageName,
  isPublicPackagistRepositoryUrl,
  normalizePackagistPackageName
} from "../core/packagist.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makePackagistReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

const dependencySections = ["require", "require-dev"] as const;

type RepositoryPolicy = {
  skipAll: boolean;
  skippedPackages: ReadonlySet<string>;
  skippedPatterns: readonly string[];
};

export function parseComposerJson(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const warnings: string[] = [];
  const parsed = parseJsonObject(options.content, options.sourceFile);
  const policy = repositoryPolicy(parsed.repositories);

  if (policy.skipAll) {
    return { references: [], warnings };
  }

  const references: DependencyReference[] = [];

  for (const section of dependencySections) {
    const dependencies = parsed[section];
    if (!isRecord(dependencies)) {
      continue;
    }

    for (const [rawName, rawVersion] of Object.entries(dependencies)) {
      if (isComposerPlatformPackageName(rawName) || typeof rawVersion !== "string") {
        continue;
      }

      const packageName = normalizePackagistPackageName(rawName);
      if (packageName === undefined) {
        warnings.push(`Skipped invalid Packagist package name ${rawName}.`);
        continue;
      }

      if (isSkippedByRepositoryPolicy(packageName, policy)) {
        continue;
      }

      references.push(
        makePackagistReference({
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

function repositoryPolicy(input: unknown): RepositoryPolicy {
  const skippedPackages = new Set<string>();
  const skippedPatterns: string[] = [];
  let skipAll = false;

  for (const repository of repositoryEntries(input)) {
    if (isPackagistDisabledRepository(repository)) {
      skipAll = true;
      continue;
    }

    if (isPublicPackagistRepository(repository)) {
      continue;
    }

    const exactPackages = packageNamesFromRepository(repository);
    for (const packageName of exactPackages) {
      skippedPackages.add(packageName);
    }

    const onlyPatterns = stringArray(repository.only);
    if (onlyPatterns.length > 0) {
      skippedPatterns.push(...onlyPatterns.map((pattern) => pattern.toLowerCase()));
      continue;
    }

    if (exactPackages.length === 0) {
      skipAll = true;
    }
  }

  return { skipAll, skippedPackages, skippedPatterns };
}

function repositoryEntries(input: unknown): Record<string, unknown>[] {
  if (input === undefined) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.filter(isRecord);
  }

  if (!isRecord(input)) {
    return [];
  }

  const entries: Record<string, unknown>[] = [];
  if (input["packagist.org"] === false) {
    entries.push({ "packagist.org": false });
  }

  for (const [key, value] of Object.entries(input)) {
    if (key !== "packagist.org" && isRecord(value)) {
      entries.push(value);
    }
  }

  return entries;
}

function isPackagistDisabledRepository(
  repository: Record<string, unknown>
): boolean {
  return repository["packagist.org"] === false;
}

function isPublicPackagistRepository(
  repository: Record<string, unknown>
): boolean {
  const type = readString(repository, "type")?.toLowerCase();
  const url = readString(repository, "url");

  return (
    type === "composer" &&
    url !== undefined &&
    isPublicPackagistRepositoryUrl(url)
  );
}

function packageNamesFromRepository(
  repository: Record<string, unknown>
): string[] {
  const packageMetadata = repository.package;
  const entries = Array.isArray(packageMetadata) ? packageMetadata : [packageMetadata];

  return entries.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.name !== "string") {
      return [];
    }

    const packageName = normalizePackagistPackageName(entry.name);
    return packageName === undefined ? [] : [packageName];
  });
}

function isSkippedByRepositoryPolicy(
  packageName: string,
  policy: RepositoryPolicy
): boolean {
  return (
    policy.skippedPackages.has(packageName) ||
    policy.skippedPatterns.some((pattern) =>
      matchesComposerRepositoryPattern(packageName, pattern)
    )
  );
}

function matchesComposerRepositoryPattern(
  packageName: string,
  pattern: string
): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/gu, "\\$&").replace(/\*/gu, ".*");
  return new RegExp(`^${escaped}$`, "u").test(packageName);
}

function stringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((entry): entry is string => typeof entry === "string");
}

function readString(
  input: Record<string, unknown>,
  key: string
): string | undefined {
  const value = input[key];
  return typeof value === "string" ? value : undefined;
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
