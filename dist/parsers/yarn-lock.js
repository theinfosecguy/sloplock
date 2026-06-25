import { normalizeNpmPackageName } from "../core/npm.js";
import { makeNpmReference } from "./common.js";
export function parseYarnLock(options) {
    const references = [];
    const lines = options.content.split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
        if (!isDescriptorLine(line)) {
            continue;
        }
        for (const descriptor of splitDescriptors(line)) {
            const packageName = packageNameFromYarnDescriptor(descriptor);
            if (packageName === undefined) {
                continue;
            }
            references.push(makeNpmReference({
                name: packageName,
                sourceFile: options.sourceFile,
                sourceLine: index + 1,
                sourceKind: "lockfile",
                isDirect: false
            }));
        }
    }
    return {
        references: dedupeReferences(references),
        warnings: []
    };
}
function isDescriptorLine(line) {
    return line.trimEnd().endsWith(":") && !line.startsWith(" ") && !line.startsWith("\t");
}
function splitDescriptors(line) {
    const trimmed = line.trim().replace(/:$/u, "");
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed
            .slice(1, -1)
            .split(/",\s*"/u)
            .map((descriptor) => descriptor.trim())
            .filter(Boolean);
    }
    return trimmed
        .split(/,\s*/u)
        .map((descriptor) => descriptor.replace(/^"|"$/gu, "").trim())
        .filter(Boolean);
}
function packageNameFromYarnDescriptor(descriptor) {
    if (descriptor.includes("@npm:")) {
        const [rawBeforeNpm, rawAfterNpm] = descriptor.split("@npm:", 2);
        if (rawBeforeNpm === undefined || rawAfterNpm === undefined) {
            return undefined;
        }
        const aliasTarget = packageNameFromPossibleAliasTarget(rawAfterNpm);
        if (aliasTarget !== undefined) {
            return aliasTarget;
        }
        return normalizeNpmPackageName(rawBeforeNpm);
    }
    if (descriptor.startsWith("@")) {
        return normalizeNpmPackageName(descriptor.match(/^(@[^/]+\/[^@/]+)/u)?.[1] ?? "");
    }
    return normalizeNpmPackageName(descriptor.match(/^([^@]+)/u)?.[1] ?? "");
}
function packageNameFromPossibleAliasTarget(value) {
    if (value.startsWith("@")) {
        const match = value.match(/^(@[^/]+\/[^@/]+)@/u);
        return match?.[1] === undefined
            ? undefined
            : normalizeNpmPackageName(match[1]);
    }
    const match = value.match(/^([a-z0-9][a-z0-9._-]*)@/iu);
    return match?.[1] === undefined ? undefined : normalizeNpmPackageName(match[1]);
}
function dedupeReferences(references) {
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
//# sourceMappingURL=yarn-lock.js.map