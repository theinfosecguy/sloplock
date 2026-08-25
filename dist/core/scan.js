import { stat } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/load-config.js";
import { discoverDependencyFiles, parseWorkspaceFiles } from "../discovery/find-files.js";
import { parseChangedDependencyReferences } from "../discovery/git.js";
import { filterNugetReferencesBySourcePolicy } from "../discovery/nuget-config.js";
import { DefaultRegistryClient } from "../registries/index.js";
import { UsageError } from "./errors.js";
import { goPrivatePatternsFromEnvironment, matchesGoPrivateModulePattern, splitGoPrivatePatternList } from "./go.js";
import { normalizePackageName } from "./packages.js";
import { applySuppressions, buildPackageNotFoundFinding, buildPackageTooNewFinding } from "./policy.js";
const defaultRegistryConcurrency = 8;
export async function scan(options) {
    const rootDir = await resolveScanRoot(options.rootDir);
    const now = options.now ?? new Date();
    const loadedConfig = await loadConfig({
        rootDir,
        ...(options.configPath === undefined ? {} : { configPath: options.configPath }),
        ...(options.failOn === undefined ? {} : { failOn: options.failOn }),
        now
    });
    const parsed = await parseReferences({
        rootDir,
        changedOnly: options.changedOnly ?? false,
        ...(options.baseRef === undefined ? {} : { baseRef: options.baseRef })
    });
    const warnings = [
        ...loadedConfig.warnings,
        ...parsed.warnings
    ];
    const sourceFiltered = await filterNugetReferencesBySourcePolicy({
        rootDir,
        references: parsed.references,
        privatePackages: loadedConfig.config.nuget.privatePackages
    });
    warnings.push(...sourceFiltered.warnings);
    const activeEcosystems = options.ecosystems ?? loadedConfig.config.ecosystems;
    const goPrivatePatterns = [
        ...loadedConfig.config.go.privateModules,
        ...goPrivatePatternsFromEnvironment()
    ];
    const bestReferences = selectBestReferences(sourceFiltered.references.filter((reference) => activeEcosystems.includes(reference.ecosystem) &&
        !isPrivateGoModuleReference(reference, goPrivatePatterns)));
    const evaluations = await evaluateReferences({
        references: bestReferences,
        options,
        now,
        config: loadedConfig.config
    });
    return {
        findings: applySuppressions(evaluations.flatMap(({ reference, findings }) => findings.map((finding) => ({
            ...finding,
            source: findingSource(reference.sourceFile, reference.sourceLine)
        }))), loadedConfig.config),
        warnings: [...warnings, ...evaluations.flatMap((evaluation) => evaluation.warnings)],
        registryFailures: evaluations.flatMap((evaluation) => evaluation.registryFailures),
        scannedDependencies: bestReferences.length,
        failOn: loadedConfig.config.failOn
    };
}
export async function checkPackages(options) {
    const references = new Map();
    for (const input of options.packages) {
        const name = normalizePackageName(input.ecosystem, input.name);
        if (name === undefined) {
            throw new UsageError(`Package '${input.name}' is not a valid ${input.ecosystem} package name.`);
        }
        const reference = {
            ecosystem: input.ecosystem,
            name,
            ...(input.sourceFile === undefined
                ? {}
                : { source: findingSource(input.sourceFile, input.sourceLine) })
        };
        const key = referenceKey(reference);
        if (!references.has(key)) {
            references.set(key, reference);
        }
    }
    const now = options.now ?? new Date();
    const loadedConfig = await loadConfig({
        rootDir: options.rootDir ?? ".",
        ...(options.configPath === undefined ? {} : { configPath: options.configPath }),
        ...(options.failOn === undefined ? {} : { failOn: options.failOn }),
        now
    });
    const evaluations = await evaluateReferences({
        references: [...references.values()],
        options,
        now,
        config: loadedConfig.config
    });
    return {
        results: evaluations.map((evaluation) => evaluation.result),
        findings: applySuppressions(evaluations.flatMap(({ reference, findings }) => findings.map((finding) => reference.source === undefined ? finding : { ...finding, source: reference.source })), loadedConfig.config),
        warnings: [
            ...loadedConfig.warnings,
            ...evaluations.flatMap((evaluation) => evaluation.warnings)
        ],
        registryFailures: evaluations.flatMap((evaluation) => evaluation.registryFailures),
        failOn: loadedConfig.config.failOn
    };
}
async function resolveScanRoot(rootDir) {
    const resolved = path.resolve(rootDir);
    try {
        if ((await stat(resolved)).isDirectory()) {
            return resolved;
        }
    }
    catch {
        // Reported below alongside the non-directory case.
    }
    throw new UsageError(`Scan path '${rootDir}' does not exist or is not a readable directory.`);
}
function evaluateReferences(input) {
    const registryClient = input.options.registryClient ?? new DefaultRegistryClient();
    return mapWithConcurrency(input.references, normalizedConcurrency(input.options.registryConcurrency), async (reference) => ({
        reference,
        ...(await evaluateReference({
            reference,
            registryClient,
            now: input.now,
            config: input.config
        }))
    }));
}
function findingSource(file, line) {
    return line === undefined ? { file } : { file, line };
}
async function evaluateReference(input) {
    const registryPackage = await input.registryClient.getPackage({
        ecosystem: input.reference.ecosystem,
        name: input.reference.name
    });
    switch (registryPackage.status) {
        case "found": {
            const finding = buildPackageTooNewFinding(input.reference, registryPackage, input.config, input.now);
            const warnings = registryPackage.firstPublishedAt === undefined
                ? [
                    {
                        message: `Package ${input.reference.name} returned no first publish timestamp; cooldown skipped.`
                    }
                ]
                : [];
            return {
                result: registryPackage,
                findings: finding === undefined ? [] : [finding],
                warnings,
                registryFailures: []
            };
        }
        case "not_found":
            if (isAmbiguousMavenSource(input.reference)) {
                const reason = input.reference.registrySource === "ambiguous-lockfile-source"
                    ? "Gradle lockfiles do not record repository source"
                    : "pom.xml declares custom repositories";
                return {
                    result: registryPackage,
                    findings: [],
                    warnings: [
                        {
                            message: `Skipped Maven coordinate ${input.reference.name} because ${reason} and Maven Central did not prove the coordinate is public.`
                        }
                    ],
                    registryFailures: []
                };
            }
            return {
                result: registryPackage,
                findings: [buildPackageNotFoundFinding(input.reference)],
                warnings: [],
                registryFailures: []
            };
        default:
            return {
                result: registryPackage,
                findings: [],
                warnings: [
                    {
                        message: `Registry check failed for ${input.reference.name}: ${registryPackage.message}`
                    }
                ],
                registryFailures: [registryPackage]
            };
    }
}
async function parseReferences(input) {
    if (input.changedOnly) {
        return parseChangedDependencyReferences({
            rootDir: input.rootDir,
            ...(input.baseRef === undefined ? {} : { baseRef: input.baseRef })
        });
    }
    const files = await discoverDependencyFiles(input.rootDir);
    return parseWorkspaceFiles({ rootDir: input.rootDir, files });
}
function isPrivateGoModuleReference(reference, patterns) {
    return (reference.ecosystem === "go" &&
        patterns.some((pattern) => splitGoPrivatePatternList(pattern).some((splitPattern) => matchesGoPrivateModulePattern(reference.name, splitPattern))));
}
function selectBestReferences(references) {
    const byPackage = new Map();
    for (const reference of references) {
        const key = referenceKey(reference);
        const existing = byPackage.get(key);
        if (existing === undefined || referenceScore(reference) < referenceScore(existing)) {
            byPackage.set(key, reference);
        }
    }
    return [...byPackage.values()].sort((left, right) => left.ecosystem.localeCompare(right.ecosystem) ||
        left.name.localeCompare(right.name));
}
function referenceKey(reference) {
    return `${reference.ecosystem}:${reference.name}`;
}
function referenceScore(reference) {
    const sourceKindScore = {
        manifest: 0,
        lockfile: reference.isDirect ? 1 : 2
    };
    const registrySourceScore = isAmbiguousMavenSource(reference)
        ? 1
        : 0;
    return sourceKindScore[reference.sourceKind] * 10 + registrySourceScore;
}
function isAmbiguousMavenSource(reference) {
    return (reference.ecosystem === "maven" &&
        (reference.registrySource === "ambiguous-custom-repository" ||
            reference.registrySource === "ambiguous-lockfile-source"));
}
async function mapWithConcurrency(inputs, concurrency, mapper) {
    const outputs = new Array(inputs.length);
    let nextIndex = 0;
    async function worker() {
        while (nextIndex < inputs.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            const input = inputs[currentIndex];
            if (input !== undefined) {
                outputs[currentIndex] = await mapper(input);
            }
        }
    }
    const workerCount = Math.min(concurrency, inputs.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
        await worker();
    }));
    return outputs;
}
function normalizedConcurrency(input) {
    if (input === undefined || !Number.isFinite(input)) {
        return defaultRegistryConcurrency;
    }
    return Math.max(1, Math.floor(input));
}
//# sourceMappingURL=scan.js.map