import {
  isUnresolvedMavenValue,
  normalizeMavenPackageName
} from "../core/maven.js";
import type { DependencyReference } from "../core/types.js";
import {
  makeMavenReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parseGradleLockfile(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const references: DependencyReference[] = [];
  const lines = options.content.split(/\r?\n/u);

  lines.forEach((line, index) => {
    const reference = referenceFromLine(line, index + 1, options.sourceFile);
    if (reference !== undefined) {
      references.push(reference);
    }
  });

  return { references: dedupeReferences(references), warnings: [] };
}

function referenceFromLine(
  line: string,
  sourceLine: number,
  sourceFile: string
): DependencyReference | undefined {
  const trimmed = line.trim();
  if (
    trimmed.length === 0 ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("empty=")
  ) {
    return undefined;
  }

  const equalsIndex = trimmed.indexOf("=");
  const coordinate = equalsIndex === -1 ? trimmed : trimmed.slice(0, equalsIndex);
  const parts = coordinate.split(":");
  if (parts.length !== 3) {
    return undefined;
  }

  const [groupId, artifactId, version] = parts;
  if (
    groupId === undefined ||
    artifactId === undefined ||
    version === undefined ||
    isUnresolvedMavenValue(groupId) ||
    isUnresolvedMavenValue(artifactId) ||
    isUnresolvedMavenValue(version) ||
    version.toLowerCase().includes("snapshot")
  ) {
    return undefined;
  }

  const name = normalizeMavenPackageName(`${groupId}:${artifactId}`);
  if (name === undefined || version.trim().length === 0) {
    return undefined;
  }

  return makeMavenReference({
    name,
    versionRange: version,
    sourceFile,
    sourceLine,
    sourceKind: "lockfile",
    isDirect: false,
    registrySource: "ambiguous-lockfile-source"
  });
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
