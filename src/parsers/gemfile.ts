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

type SourceBlock = {
  depth: number;
  isPublicRubyGems: boolean;
};

export function parseGemfile(
  options: ParseDependencyFileOptions
): ParsedDependencyFile {
  const references: DependencyReference[] = [];
  const warnings: string[] = [];
  const sourceBlocks: SourceBlock[] = [];
  const lines = options.content.split(/\r?\n/u);
  let blockDepth = 0;
  let defaultSourceIsPublicRubyGems = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (/^end\b/u.test(trimmed)) {
      blockDepth = Math.max(0, blockDepth - 1);
      while (lastSourceBlockIsDeeperThan(sourceBlocks, blockDepth)) {
        sourceBlocks.pop();
      }
      return;
    }

    const source = sourceFromLine(line);
    if (source !== undefined) {
      const isPublicRubyGems = isPublicRubyGemsSourceUrl(source.url);
      if (source.opensBlock) {
        sourceBlocks.push({
          depth: blockDepth + 1,
          isPublicRubyGems
        });
        blockDepth += 1;
      } else {
        defaultSourceIsPublicRubyGems = isPublicRubyGems;
      }
      return;
    }

    if (activeSourceIsPublic(sourceBlocks, defaultSourceIsPublicRubyGems)) {
      const parsedGem = gemFromLine(line);
      if (parsedGem !== undefined) {
        const packageName = normalizeRubygemsPackageName(parsedGem.name);
        if (packageName === undefined) {
          warnings.push(`Skipped invalid RubyGems package name ${parsedGem.name}.`);
        } else if (!hasNonRegistryGemOption(parsedGem.rest)) {
          references.push(
            makeRubygemsReference({
              name: packageName,
              ...versionRangeInput(parsedGem.rest),
              sourceFile: options.sourceFile,
              sourceLine: index + 1,
              sourceKind: "manifest",
              isDirect: true
            })
          );
        }
      }
    }

    if (opensRubyBlock(trimmed)) {
      blockDepth += 1;
    }
  });

  return { references: dedupeReferences(references), warnings };
}

function sourceFromLine(
  line: string
): { url: string; opensBlock: boolean } | undefined {
  const source = /^\s*source\s+(['"])([^'"]+)\1(?<rest>.*)$/u.exec(line);
  if (source === null) {
    return undefined;
  }

  const url = source[2];
  if (url === undefined) {
    return undefined;
  }

  return {
    url,
    opensBlock: /\bdo\s*(?:\|[^|]*\|)?\s*(?:#.*)?$/u.test(source.groups?.rest ?? "")
  };
}

function gemFromLine(
  line: string
): { name: string; rest: string } | undefined {
  const gem = /^\s*gem\s+(['"])([^'"]+)\1(?<rest>.*)$/u.exec(line);
  const name = gem?.[2];
  if (gem === null || name === undefined) {
    return undefined;
  }

  return {
    name,
    rest: gem.groups?.rest ?? ""
  };
}

function activeSourceIsPublic(
  sourceBlocks: readonly SourceBlock[],
  defaultSourceIsPublicRubyGems: boolean
): boolean {
  return (
    lastSourceBlock(sourceBlocks)?.isPublicRubyGems ??
    defaultSourceIsPublicRubyGems
  );
}

function lastSourceBlock(
  sourceBlocks: readonly SourceBlock[]
): SourceBlock | undefined {
  return sourceBlocks[sourceBlocks.length - 1];
}

function lastSourceBlockIsDeeperThan(
  sourceBlocks: readonly SourceBlock[],
  blockDepth: number
): boolean {
  const sourceBlock = lastSourceBlock(sourceBlocks);
  return sourceBlock !== undefined && sourceBlock.depth > blockDepth;
}

function hasNonRegistryGemOption(rest: string): boolean {
  if (/(?:^|[,{]\s*)(?:path|git|github):\s*/u.test(rest)) {
    return true;
  }

  const source = /(?:^|[,{]\s*)source:\s*(['"])([^'"]+)\1/u.exec(rest)?.[2];
  return source !== undefined && !isPublicRubyGemsSourceUrl(source);
}

function versionRangeInput(rest: string): { versionRange?: string } {
  const versionRange = /^\s*,\s*(['"])([^'"]+)\1/u.exec(rest)?.[2]?.trim();
  return versionRange === undefined || versionRange.length === 0
    ? {}
    : { versionRange };
}

function opensRubyBlock(trimmedLine: string): boolean {
  return /\bdo\s*(?:\|[^|]*\|)?\s*(?:#.*)?$/u.test(trimmedLine);
}

function dedupeReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
