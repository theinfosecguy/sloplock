import { normalizeNugetPackageName } from "../core/nuget.js";
import type { DependencyReference } from "../core/types.js";
import {
  isRecord,
  lineNumberForPattern,
  makeNugetReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";
import {
  parseXmlElements,
  xmlAttribute,
  xmlChildText,
  type XmlElement
} from "./xml.js";

export function parseMsBuildProject(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  return {
    references: dedupeReferences(
      packageReferenceElements(options).flatMap((element) =>
        referenceFromMsBuildElement(element, options)
      )
    ),
    warnings: []
  };
}

export function parseDirectoryPackagesProps(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  return {
    references: dedupeReferences(
      packageVersionElements(options).flatMap((element) =>
        referenceFromMsBuildElement(element, options)
      )
    ),
    warnings: []
  };
}

export function parsePackagesConfig(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const references = parseXmlElements(options.content)
    .filter((element) => element.name.toLowerCase() === "package")
    .flatMap((element) => {
      const rawName = xmlAttribute(element, "id");
      const packageName =
        rawName === undefined ? undefined : normalizeNugetPackageName(rawName);
      if (packageName === undefined) {
        return [];
      }

      return [
        makeNugetReference({
          name: packageName,
          ...versionRangeInput(xmlAttribute(element, "version")),
          sourceFile: options.sourceFile,
          sourceLine: element.sourceLine,
          sourceKind: "manifest",
          isDirect: true
        })
      ];
    });

  return { references: dedupeReferences(references), warnings: [] };
}

export function parsePackagesLockJson(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseJsonObject(options.content, options.sourceFile);
  const dependencies = parsed.dependencies;
  if (!isRecord(dependencies)) {
    return { references: [], warnings: [] };
  }

  const references: DependencyReference[] = [];
  for (const frameworkDependencies of Object.values(dependencies)) {
    if (!isRecord(frameworkDependencies)) {
      continue;
    }

    for (const [rawName, metadata] of Object.entries(frameworkDependencies)) {
      const reference = lockReferenceFromEntry(rawName, metadata, options);
      if (reference !== undefined) {
        references.push(reference);
      }
    }
  }

  return { references: dedupeReferences(references), warnings: [] };
}

function packageReferenceElements(
  options: ParseDependencyFileOptions
): XmlElement[] {
  return parseXmlElements(options.content).filter((element) => {
    const name = element.name.toLowerCase();
    return name === "packagereference" || name === "globalpackagereference";
  });
}

function packageVersionElements(
  options: ParseDependencyFileOptions
): XmlElement[] {
  return parseXmlElements(options.content).filter((element) => {
    const name = element.name.toLowerCase();
    return name === "packageversion" || name === "globalpackagereference";
  });
}

function referenceFromMsBuildElement(
  element: XmlElement,
  options: ParseDependencyFileOptions
): DependencyReference[] {
  const rawName = xmlAttribute(element, "include") ?? xmlAttribute(element, "update");
  const packageName =
    rawName === undefined ? undefined : normalizeNugetPackageName(rawName);
  if (packageName === undefined) {
    return [];
  }

  return [
    makeNugetReference({
      name: packageName,
      ...versionRangeInput(
        xmlAttribute(element, "version") ??
          xmlAttribute(element, "versionoverride") ??
          xmlChildText(element, "Version")
      ),
      sourceFile: options.sourceFile,
      sourceLine: element.sourceLine,
      sourceKind: "manifest",
      isDirect: true
    })
  ];
}

function lockReferenceFromEntry(
  rawName: string,
  metadata: unknown,
  options: ParseDependencyFileOptions
): DependencyReference | undefined {
  if (!isRecord(metadata)) {
    return undefined;
  }

  const packageName = normalizeNugetPackageName(rawName);
  if (packageName === undefined || packageLockEntryIsProject(metadata)) {
    return undefined;
  }

  const rawType = readString(metadata.type);
  const isDirect =
    rawType === undefined ||
    rawType.toLowerCase() === "direct" ||
    rawType.toLowerCase() === "centraltransitive";
  const versionRange = readString(metadata.requested) ?? readString(metadata.resolved);

  return makeNugetReference({
    name: packageName,
    ...versionRangeInput(versionRange),
    sourceFile: options.sourceFile,
    ...lineNumberInput(options.content, rawName),
    sourceKind: "lockfile",
    isDirect
  });
}

function packageLockEntryIsProject(metadata: Record<string, unknown>): boolean {
  const type = readString(metadata.type)?.toLowerCase();
  return type === "project" || type === "externalproject";
}

function versionRangeInput(versionRange: string | undefined): {
  versionRange?: string;
} {
  const trimmed = versionRange?.trim();
  return trimmed === undefined || trimmed.length === 0 ? {} : { versionRange: trimmed };
}

function parseJsonObject(
  content: string,
  sourceFile: string
): Record<string, unknown> {
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

function readString(input: unknown): string | undefined {
  return typeof input === "string" && input.trim().length > 0
    ? input.trim()
    : undefined;
}

function lineNumberInput(
  content: string,
  packageName: string
): { sourceLine?: number } {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const sourceLine = lineNumberForPattern(
    content,
    new RegExp(`^\\s*"${escaped}"\\s*:`, "imu")
  );
  return sourceLine === undefined ? {} : { sourceLine };
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
