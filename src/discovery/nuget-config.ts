import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  isNugetOrgSourceUrl,
  matchesNugetPackagePattern
} from "../core/nuget.js";
import type { ConfigWarning, DependencyReference } from "../core/types.js";
import { toPosixPath } from "../parsers/common.js";
import { parseXmlElements, xmlAttribute, type XmlElement } from "../parsers/xml.js";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".next",
  ".turbo"
]);

type NugetConfigPolicy =
  | { mode: "default" }
  | { mode: "skip-all"; reason: string; file?: string }
  | { mode: "mapped"; patterns: readonly string[]; file?: string };

export async function filterNugetReferencesBySourcePolicy(input: {
  rootDir: string;
  references: readonly DependencyReference[];
  privatePackages?: readonly string[];
}): Promise<{
  references: DependencyReference[];
  warnings: ConfigWarning[];
}> {
  const nugetReferences = input.references.filter(
    (reference) => reference.ecosystem === "nuget"
  );
  if (nugetReferences.length === 0) {
    return { references: [...input.references], warnings: [] };
  }

  const nonNugetReferences = input.references.filter(
    (reference) => reference.ecosystem !== "nuget"
  );
  const privatePackageReferences = nugetReferences.filter((reference) =>
    (input.privatePackages ?? []).some((pattern) =>
      matchesNugetPackagePattern(reference.name, pattern)
    )
  );
  const sourcePolicyNugetReferences = nugetReferences.filter(
    (reference) => !privatePackageReferences.includes(reference)
  );
  const privatePackageWarnings =
    privatePackageReferences.length === 0
      ? []
      : [
          {
            message: `Skipped ${privatePackageReferences.length} NuGet package reference${privatePackageReferences.length === 1 ? "" : "s"} configured as private.`
          }
        ];

  if (sourcePolicyNugetReferences.length === 0) {
    return {
      references: nonNugetReferences,
      warnings: privatePackageWarnings
    };
  }

  const policy = await loadNugetConfigPolicy(input.rootDir);
  if (policy.mode === "default") {
    return {
      references: [...nonNugetReferences, ...sourcePolicyNugetReferences],
      warnings: privatePackageWarnings
    };
  }

  if (policy.mode === "skip-all") {
    return {
      references: nonNugetReferences,
      warnings: [
        ...privatePackageWarnings,
        {
          ...(policy.file === undefined ? {} : { file: policy.file }),
          message: policy.reason
        }
      ]
    };
  }

  const filteredNugetReferences = sourcePolicyNugetReferences.filter((reference) =>
    policy.patterns.some((pattern) => nugetPatternMatches(pattern, reference.name))
  );
  const skippedCount =
    sourcePolicyNugetReferences.length - filteredNugetReferences.length;
  const warnings =
    skippedCount === 0
      ? privatePackageWarnings
      : [
          ...privatePackageWarnings,
          {
            ...(policy.file === undefined ? {} : { file: policy.file }),
            message: `Skipped ${skippedCount} NuGet package reference${skippedCount === 1 ? "" : "s"} not mapped to NuGet.org.`
          }
        ];

  return {
    references: [...nonNugetReferences, ...filteredNugetReferences],
    warnings
  };
}

async function loadNugetConfigPolicy(rootDir: string): Promise<NugetConfigPolicy> {
  const files = await discoverNugetConfigFiles(rootDir);
  if (files.length === 0) {
    return { mode: "default" };
  }

  const configs = await Promise.all(
    files.map(async (file) => ({
      file,
      content: await readFile(path.join(rootDir, file), "utf8")
    }))
  );
  const parsedConfigs = configs.map((config) => ({
    file: config.file,
    parsed: parseNugetConfig(config.content)
  }));
  const mappedConfig = parsedConfigs.find(
    (config) => config.parsed.packageSourceMappings.length > 0
  );
  if (mappedConfig !== undefined) {
    const nugetSourceKeys = new Set(
      mappedConfig.parsed.packageSources
        .filter((source) => isNugetOrgSourceUrl(source.value))
        .map((source) => source.key)
    );
    const patterns = mappedConfig.parsed.packageSourceMappings
      .filter((mapping) => nugetSourceKeys.has(mapping.sourceKey))
      .flatMap((mapping) => mapping.patterns)
      .sort();

    return patterns.length === 0
      ? {
          mode: "skip-all",
          file: mappedConfig.file,
          reason:
            "Skipped NuGet package references because NuGet.config packageSourceMapping does not map any package to NuGet.org."
        }
      : { mode: "mapped", file: mappedConfig.file, patterns };
  }

  const clearingConfig = parsedConfigs.find((config) => {
    if (!config.parsed.clearsPackageSources) {
      return false;
    }

    const hasNugetOrg = config.parsed.packageSources.some((source) =>
      isNugetOrgSourceUrl(source.value)
    );
    const hasPrivateSource = config.parsed.packageSources.some(
      (source) => !isNugetOrgSourceUrl(source.value)
    );
    return !hasNugetOrg || hasPrivateSource;
  });

  if (clearingConfig !== undefined) {
    return {
      mode: "skip-all",
      file: clearingConfig.file,
      reason:
        "Skipped NuGet package references because NuGet.config uses non-NuGet.org package sources without packageSourceMapping."
    };
  }

  return { mode: "default" };
}

async function discoverNugetConfigFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  await walk(rootDir, rootDir, files);
  return files.sort();
}

async function walk(
  rootDir: string,
  currentDir: string,
  files: string[]
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(rootDir, path.join(currentDir, entry.name), files);
      }
      continue;
    }

    if (!entry.isFile() || !/^nuget\.config$/iu.test(entry.name)) {
      continue;
    }

    files.push(toPosixPath(path.relative(rootDir, path.join(currentDir, entry.name))));
  }
}

function parseNugetConfig(content: string): {
  packageSources: Array<{ key: string; value: string }>;
  packageSourceMappings: Array<{ sourceKey: string; patterns: string[] }>;
  clearsPackageSources: boolean;
} {
  const elements = parseXmlElements(content);
  const packageSources = elements
    .filter((element) => element.name.toLowerCase() === "add")
    .filter((element) => isInsideSection(content, element, "packageSources"))
    .flatMap((element) => {
      const key = xmlAttribute(element, "key");
      const value = xmlAttribute(element, "value");
      return key === undefined || value === undefined ? [] : [{ key, value }];
    });
  const packageSourceMappings = elements
    .filter((element) => element.name.toLowerCase() === "packagesource")
    .map((element) => ({
      sourceKey: xmlAttribute(element, "key") ?? "",
      patterns: packagePatternsForSource(element)
    }))
    .filter((mapping) => mapping.sourceKey.length > 0);

  return {
    packageSources,
    packageSourceMappings,
    clearsPackageSources: elements.some(
      (element) =>
        element.name.toLowerCase() === "clear" &&
        isInsideSection(content, element, "packageSources")
    )
  };
}

function packagePatternsForSource(sourceElement: XmlElement): string[] {
  return parseXmlElements(sourceElement.innerContent)
    .filter((element) => element.name.toLowerCase() === "package")
    .flatMap((element) => {
      const pattern = xmlAttribute(element, "pattern");
      return pattern === undefined ? [] : [pattern.trim().toLowerCase()];
    });
}

function isInsideSection(
  content: string,
  element: XmlElement,
  sectionName: string
): boolean {
  const elementOffset = lineOffset(content, element.sourceLine);
  const sectionOpen = new RegExp(`<${sectionName}\\b[^>]*>`, "igu");
  for (const match of content.matchAll(sectionOpen)) {
    const start = match.index;
    if (start > elementOffset) {
      continue;
    }

    const end = closingElementOffset(content, start, sectionName);
    if (elementOffset < end) {
      return true;
    }
  }

  return false;
}

function closingElementOffset(
  content: string,
  start: number,
  elementName: string
): number {
  const pattern = new RegExp(`</${elementName}\\s*>`, "iu");
  const match = pattern.exec(content.slice(start));
  return match?.index === undefined ? content.length : start + match.index;
}

function lineOffset(content: string, lineNumber: number): number {
  if (lineNumber <= 1) {
    return 0;
  }

  let line = 1;
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      line += 1;
      if (line === lineNumber) {
        return index + 1;
      }
    }
  }

  return content.length;
}

function nugetPatternMatches(pattern: string, packageName: string): boolean {
  return matchesNugetPackagePattern(packageName, pattern);
}
