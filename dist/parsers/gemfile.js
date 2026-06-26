import { isPublicRubyGemsSourceUrl, normalizeRubygemsPackageName } from "../core/rubygems.js";
import { makeRubygemsReference } from "./common.js";
export function parseGemfile(options) {
    const references = [];
    const warnings = [];
    const sourceBlocks = [];
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
            }
            else {
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
                }
                else if (!hasNonRegistryGemOption(parsedGem.rest)) {
                    references.push(makeRubygemsReference({
                        name: packageName,
                        ...versionRangeInput(parsedGem.rest),
                        sourceFile: options.sourceFile,
                        sourceLine: index + 1,
                        sourceKind: "manifest",
                        isDirect: true
                    }));
                }
            }
        }
        if (opensRubyBlock(trimmed)) {
            blockDepth += 1;
        }
    });
    return { references: dedupeReferences(references), warnings };
}
function sourceFromLine(line) {
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
function gemFromLine(line) {
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
function activeSourceIsPublic(sourceBlocks, defaultSourceIsPublicRubyGems) {
    return (lastSourceBlock(sourceBlocks)?.isPublicRubyGems ??
        defaultSourceIsPublicRubyGems);
}
function lastSourceBlock(sourceBlocks) {
    return sourceBlocks[sourceBlocks.length - 1];
}
function lastSourceBlockIsDeeperThan(sourceBlocks, blockDepth) {
    const sourceBlock = lastSourceBlock(sourceBlocks);
    return sourceBlock !== undefined && sourceBlock.depth > blockDepth;
}
function hasNonRegistryGemOption(rest) {
    if (/(?:^|[,{]\s*)(?:path|git|github):\s*/u.test(rest)) {
        return true;
    }
    const source = /(?:^|[,{]\s*)source:\s*(['"])([^'"]+)\1/u.exec(rest)?.[2];
    return source !== undefined && !isPublicRubyGemsSourceUrl(source);
}
function versionRangeInput(rest) {
    const versionRange = /^\s*,\s*(['"])([^'"]+)\1/u.exec(rest)?.[2]?.trim();
    return versionRange === undefined || versionRange.length === 0
        ? {}
        : { versionRange };
}
function opensRubyBlock(trimmedLine) {
    return /\bdo\s*(?:\|[^|]*\|)?\s*(?:#.*)?$/u.test(trimmedLine);
}
function dedupeReferences(references) {
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
//# sourceMappingURL=gemfile.js.map