import {
  isComposerPlatformPackageName,
  isPublicPackagistNotificationUrl,
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

export function parseComposerLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseJsonObject(options.content, options.sourceFile);
  const references = [
    ...parsePackageEntries(parsed.packages, options),
    ...parsePackageEntries(parsed["packages-dev"], options)
  ];

  return {
    references: dedupeReferences(references),
    warnings: []
  };
}

function parsePackageEntries(
  packages: unknown,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (!Array.isArray(packages)) {
    return [];
  }

  return packages.flatMap((entry) => referenceFromPackageEntry(entry, options));
}

function referenceFromPackageEntry(
  entry: unknown,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  if (!isRecord(entry) || !isPackagistLockEntry(entry)) {
    return [];
  }

  const rawName = entry.name;
  if (typeof rawName !== "string" || isComposerPlatformPackageName(rawName)) {
    return [];
  }

  const packageName = normalizePackagistPackageName(rawName);
  if (packageName === undefined) {
    return [];
  }

  return [
    makePackagistReference({
      name: packageName,
      ...versionRangeInput(entry.version),
      sourceFile: options.sourceFile,
      sourceKind: "lockfile",
      isDirect: false,
      ...lineNumberInput(options.content, rawName)
    })
  ];
}

function isPackagistLockEntry(entry: Record<string, unknown>): boolean {
  const notificationUrl = readString(entry, "notification-url");
  if (notificationUrl !== undefined) {
    return isPublicPackagistNotificationUrl(notificationUrl);
  }

  const repositoryUrl = readString(entry, "repository");
  if (repositoryUrl !== undefined) {
    return isPublicPackagistRepositoryUrl(repositoryUrl);
  }

  return false;
}

function versionRangeInput(version: unknown): { versionRange?: string } {
  return typeof version === "string" && version.trim().length > 0
    ? { versionRange: version.trim() }
    : {};
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

function lineNumberInput(
  content: string,
  packageName: string
): { sourceLine?: number } {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const sourceLine = lineNumberForPattern(
    content,
    new RegExp(`"name"\\s*:\\s*"${escaped}"`, "u")
  );
  return sourceLine === undefined ? {} : { sourceLine };
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
