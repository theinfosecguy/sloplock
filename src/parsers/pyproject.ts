import { parse as parseToml } from "smol-toml";
import { normalizePypiPackageName } from "../core/pypi.js";
import {
  isRecord,
  lineNumberForPattern,
  makePypiReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";
import { parsePythonRequirementString } from "./python-requirements.js";

export function parsePyproject(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const parsed = parseTomlObject(options.content, options.sourceFile);
  const references = [
    ...parseProjectDependencies(parsed, options),
    ...parsePoetryDependencies(parsed, options)
  ];

  return { references, warnings: [] };
}

function parseProjectDependencies(
  parsed: Record<string, unknown>,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  const project = readRecord(parsed, "project");
  if (project === undefined) {
    return [];
  }

  return [
    ...parseRequirementArray(project.dependencies, options),
    ...parseOptionalDependencyGroups(
      readRecord(project, "optional-dependencies"),
      options
    )
  ];
}

function parseOptionalDependencyGroups(
  groups: Record<string, unknown> | undefined,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  if (groups === undefined) {
    return [];
  }

  return Object.values(groups).flatMap((group) =>
    parseRequirementArray(group, options)
  );
}

function parsePoetryDependencies(
  parsed: Record<string, unknown>,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  const poetry = readRecord(readRecord(parsed, "tool"), "poetry");
  if (poetry === undefined) {
    return [];
  }

  return [
    ...parsePoetryDependencyTable(readRecord(poetry, "dependencies"), options),
    ...parsePoetryDependencyGroups(readRecord(poetry, "group"), options)
  ];
}

function parsePoetryDependencyGroups(
  groups: Record<string, unknown> | undefined,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  if (groups === undefined) {
    return [];
  }

  return Object.values(groups).flatMap((group) =>
    parsePoetryDependencyTable(
      readRecord(isRecord(group) ? group : undefined, "dependencies"),
      options
    )
  );
}

function parseRequirementArray(
  input: unknown,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((requirement) => {
    if (typeof requirement !== "string") {
      return [];
    }

    return parsePythonRequirementString({
      requirement,
      sourceFile: options.sourceFile,
      ...lineNumberInput(options.content, requirement)
    }).references;
  });
}

function parsePoetryDependencyTable(
  table: Record<string, unknown> | undefined,
  options: ParseDependencyFileOptions
): ParsedDependencyFile["references"] {
  if (table === undefined) {
    return [];
  }

  return Object.entries(table).flatMap(([name, specifier]) => {
    if (name === "python" || isLocalPoetrySpecifier(specifier)) {
      return [];
    }

    const packageName = normalizePypiPackageName(name);
    if (packageName === undefined) {
      return [];
    }

    return [
      makePypiReference({
        name: packageName,
        ...versionRangeInput(specifier),
        sourceFile: options.sourceFile,
        sourceKind: "manifest",
        isDirect: true,
        ...lineNumberInput(options.content, name)
      })
    ];
  });
}

function versionRangeInput(specifier: unknown): { versionRange?: string } {
  if (typeof specifier === "string" && specifier.trim().length > 0) {
    return { versionRange: specifier.trim() };
  }

  if (isRecord(specifier) && typeof specifier.version === "string") {
    return { versionRange: specifier.version.trim() };
  }

  return {};
}

function isLocalPoetrySpecifier(specifier: unknown): boolean {
  if (!isRecord(specifier)) {
    return false;
  }

  return ["path", "git", "url"].some((field) => specifier[field] !== undefined);
}

function readRecord(
  input: Record<string, unknown> | undefined,
  key: string | undefined
): Record<string, unknown> | undefined {
  const value = key === undefined ? input : input?.[key];
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

function lineNumberInput(
  content: string,
  pattern: string
): { sourceLine?: number } {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const sourceLine = lineNumberForPattern(content, new RegExp(escaped, "u"));
  return sourceLine === undefined ? {} : { sourceLine };
}
