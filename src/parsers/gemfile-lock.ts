import {
  isPublicRubyGemsSourceUrl,
  normalizeRubygemsPackageName
} from "../core/rubygems.js";
import type { DependencyReference } from "../core/types.js";
import {
  makeRubygemsReference,
  type ParsedDependencyFile,
  type ParseDependencyFileOptions
} from "./common.js";

export function parseGemfileLock(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  return {
    references: dedupeReferences(parseGemSection(options)),
    warnings: []
  };
}

function parseGemSection(
  options: ParseDependencyFileOptions
): DependencyReference[] {
  const references: DependencyReference[] = [];
  const lines = options.content.split(/\r?\n/u);
  let currentSection = "";
  let remotes: string[] = [];
  let inPublicSpecs = false;

  lines.forEach((line, index) => {
    const section = /^([A-Z][A-Z0-9_ ]*)\s*$/u.exec(line)?.[1];
    if (section !== undefined) {
      currentSection = section;
      remotes = [];
      inPublicSpecs = false;
      return;
    }

    if (currentSection !== "GEM") {
      return;
    }

    const remote = /^\s{2}remote:\s*(\S+)\s*$/u.exec(line)?.[1];
    if (remote !== undefined) {
      remotes.push(remote);
      return;
    }

    if (/^\s{2}specs:\s*$/u.test(line)) {
      inPublicSpecs =
        remotes.length > 0 && remotes.every(isPublicRubyGemsSourceUrl);
      return;
    }

    if (!inPublicSpecs) {
      return;
    }

    const spec = /^\s{4}([A-Za-z0-9_.-]+)\s+\(([^)]+)\)/u.exec(line);
    if (spec === null) {
      return;
    }

    const rawPackageName = spec[1];
    const versionRange = spec[2];
    if (rawPackageName === undefined || versionRange === undefined) {
      return;
    }

    const packageName = normalizeRubygemsPackageName(rawPackageName);
    if (packageName === undefined) {
      return;
    }

    references.push(
      makeRubygemsReference({
        name: packageName,
        versionRange,
        sourceFile: options.sourceFile,
        sourceLine: index + 1,
        sourceKind: "lockfile",
        isDirect: false
      })
    );
  });

  return references;
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
