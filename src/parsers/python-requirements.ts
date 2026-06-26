import { normalizePypiPackageName } from "../core/pypi.js";
import {
  makePypiReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

const packageRequirementPattern =
  /^\s*([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)(.*)$/u;

const directReferencePattern = /\s@\s/u;

export function parsePythonRequirements(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const references: ReturnType<typeof makePypiReference>[] = [];
  const includedFiles: string[] = [];

  for (const [index, line] of options.content.split(/\r?\n/u).entries()) {
    const include = includedFileFromRequirementLine(line);
    if (include !== undefined) {
      includedFiles.push(include);
      continue;
    }

    references.push(
      ...referenceFromRequirementLine({
        line,
        sourceFile: options.sourceFile,
        sourceLine: index + 1
      })
    );
  }

  return {
    references,
    warnings: [],
    ...(includedFiles.length === 0 ? {} : { includedFiles })
  };
}

export function parsePythonRequirementString(input: {
  requirement: string;
  sourceFile: string;
  sourceLine?: number;
}): ParsedDependencyFile {
  const reference = referenceFromRequirementLine({
    line: input.requirement,
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine })
  });

  return { references: reference, warnings: [] };
}

function referenceFromRequirementLine(input: {
  line: string;
  sourceFile: string;
  sourceLine?: number;
}): ReturnType<typeof makePypiReference>[] {
  const withoutComment = stripComment(input.line).trim();
  if (
    withoutComment.length === 0 ||
    isRequirementOption(withoutComment) ||
    isDirectOrLocalRequirement(withoutComment)
  ) {
    return [];
  }

  const requirement = withoutComment.split(";")[0]?.trim() ?? "";
  const match = packageRequirementPattern.exec(requirement);
  if (match === null) {
    return [];
  }

  const rawName = match[1];
  const rawVersionRange = match[2]?.trim();
  if (rawName === undefined || rawVersionRange === undefined) {
    return [];
  }

  if (
    rawVersionRange.length > 0 &&
    !rawVersionRange.startsWith("[") &&
    !/^(?:===|~=|==|!=|<=|>=|<|>|,|\s)/u.test(rawVersionRange)
  ) {
    return [];
  }

  const packageName = normalizePypiPackageName(rawName);
  if (packageName === undefined) {
    return [];
  }

  return [
    makePypiReference({
      name: packageName,
      ...(rawVersionRange.length === 0
        ? {}
        : { versionRange: rawVersionRange }),
      sourceFile: input.sourceFile,
      sourceKind: "manifest",
      isDirect: true,
      ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine })
    })
  ];
}

function stripComment(line: string): string {
  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith("#")) {
    return "";
  }

  return line.replace(/\s+#.*$/u, "");
}

function isRequirementOption(line: string): boolean {
  return line.startsWith("-") || line.startsWith("--");
}

function includedFileFromRequirementLine(line: string): string | undefined {
  const withoutComment = stripComment(line).trim();
  const includeMatch =
    /^(?:-r|--requirement|-c|--constraint)(?:=|\s+)(\S+)/u.exec(withoutComment);
  const includePath = includeMatch?.[1];

  if (
    includePath === undefined ||
    includePath.length === 0 ||
    includePath.startsWith("-") ||
    /^[a-z]+:\/\//iu.test(includePath)
  ) {
    return undefined;
  }

  return includePath;
}

function isDirectOrLocalRequirement(line: string): boolean {
  const lower = line.toLowerCase();

  return (
    directReferencePattern.test(line) ||
    lower.startsWith("git+") ||
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("file:") ||
    lower.startsWith("./") ||
    lower.startsWith("../") ||
    lower.startsWith("/") ||
    lower.startsWith("~")
  );
}
