import type { DependencyReference, SourceKind } from "../core/types.js";

export type ParseDependencyFileOptions = {
  sourceFile: string;
  content: string;
};

export type ParsedDependencyFile = {
  references: DependencyReference[];
  warnings: string[];
  includedFiles?: string[];
};

export function lineNumberForPattern(
  content: string,
  pattern: RegExp
): number | undefined {
  const match = pattern.exec(content);
  if (match?.index === undefined) {
    return undefined;
  }

  return content.slice(0, match.index).split("\n").length;
}

export function makeNpmReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "npm",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function makePypiReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "pypi",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function makePackagistReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "packagist",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function makeGoReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "go",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function makeCratesReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "crates",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function makeRubygemsReference(input: {
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
}): DependencyReference {
  return {
    ecosystem: "rubygems",
    name: input.name,
    ...(input.versionRange === undefined
      ? {}
      : { versionRange: input.versionRange }),
    sourceFile: input.sourceFile,
    ...(input.sourceLine === undefined ? {} : { sourceLine: input.sourceLine }),
    sourceKind: input.sourceKind,
    isDirect: input.isDirect
  };
}

export function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function toPosixPath(filePath: string): string {
  return filePath.split("\\").join("/");
}
