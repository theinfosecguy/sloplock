import path from "node:path";
import { loadConfig } from "../config/load-config.js";
import {
  discoverDependencyFiles,
  parseWorkspaceFiles
} from "../discovery/find-files.js";
import { parseChangedDependencyReferences } from "../discovery/git.js";
import { filterNugetReferencesBySourcePolicy } from "../discovery/nuget-config.js";
import { DefaultRegistryClient } from "../registries/index.js";
import {
  goPrivatePatternsFromEnvironment,
  matchesGoPrivateModulePattern,
  splitGoPrivatePatternList
} from "./go.js";
import {
  applySuppressions,
  buildPackageNotFoundFinding,
  buildPackageTooNewFinding
} from "./policy.js";
import type {
  ConfigWarning,
  DependencyReference,
  Finding,
  RegistryClient,
  RegistryPackageFailure,
  ScanOptions,
  ScanResult
} from "./types.js";

const defaultRegistryConcurrency = 8;

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const rootDir = path.resolve(options.rootDir);
  const now = options.now ?? new Date();
  const loadedConfig = await loadConfig({
    rootDir,
    ...(options.configPath === undefined ? {} : { configPath: options.configPath }),
    ...(options.failOn === undefined ? {} : { failOn: options.failOn }),
    now,
    ...(options.isCi === undefined ? {} : { isCi: options.isCi })
  });
  const parsed = await parseReferences({
    rootDir,
    changedOnly: options.changedOnly ?? false,
    ...(options.baseRef === undefined ? {} : { baseRef: options.baseRef })
  });
  const warnings: ConfigWarning[] = [
    ...loadedConfig.warnings,
    ...parsed.warnings
  ];
  const sourceFiltered = await filterNugetReferencesBySourcePolicy({
    rootDir,
    references: parsed.references
  });
  warnings.push(...sourceFiltered.warnings);
  const activeEcosystems = options.ecosystems ?? loadedConfig.config.ecosystems;
  const goPrivatePatterns = [
    ...loadedConfig.config.go.privateModules,
    ...goPrivatePatternsFromEnvironment()
  ];
  const bestReferences = selectBestReferences(
    sourceFiltered.references.filter(
      (reference) =>
        activeEcosystems.includes(reference.ecosystem) &&
        !isPrivateGoModuleReference(reference, goPrivatePatterns)
    )
  );
  const registryClient = options.registryClient ?? new DefaultRegistryClient();
  const findings: Finding[] = [];
  const registryFailures: RegistryPackageFailure[] = [];
  const registryEvaluations = await mapWithConcurrency(
    bestReferences,
    normalizedConcurrency(options.registryConcurrency),
    async (reference) =>
      evaluateReference({
        reference,
        registryClient,
        now,
        config: loadedConfig.config
      })
  );

  for (const evaluation of registryEvaluations) {
    findings.push(...evaluation.findings);
    warnings.push(...evaluation.warnings);
    registryFailures.push(...evaluation.registryFailures);
  }

  return {
    findings: applySuppressions(findings, loadedConfig.config),
    warnings,
    registryFailures,
    scannedDependencies: bestReferences.length,
    failOn: loadedConfig.config.failOn
  };
}

async function evaluateReference(input: {
  reference: DependencyReference;
  registryClient: RegistryClient;
  now: Date;
  config: Parameters<typeof buildPackageTooNewFinding>[2];
}): Promise<{
  findings: Finding[];
  warnings: ConfigWarning[];
  registryFailures: RegistryPackageFailure[];
}> {
  const registryPackage = await input.registryClient.getPackage({
    ecosystem: input.reference.ecosystem,
    name: input.reference.name
  });

  switch (registryPackage.status) {
    case "found": {
      const finding = buildPackageTooNewFinding(
        input.reference,
        registryPackage,
        input.config,
        input.now
      );
      const warnings =
        registryPackage.firstPublishedAt === undefined
          ? [
              {
                message: `Package ${input.reference.name} returned no first publish timestamp; cooldown skipped.`
              }
            ]
          : [];

      return {
        findings: finding === undefined ? [] : [finding],
        warnings,
        registryFailures: []
      };
    }
    case "not_found":
      return {
        findings: [buildPackageNotFoundFinding(input.reference)],
        warnings: [],
        registryFailures: []
      };
    default:
      return {
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

async function parseReferences(input: {
  rootDir: string;
  changedOnly: boolean;
  baseRef?: string;
}): Promise<{
  references: DependencyReference[];
  warnings: ConfigWarning[];
}> {
  if (input.changedOnly) {
    return parseChangedDependencyReferences({
      rootDir: input.rootDir,
      ...(input.baseRef === undefined ? {} : { baseRef: input.baseRef })
    });
  }

  const files = await discoverDependencyFiles(input.rootDir);
  return parseWorkspaceFiles({ rootDir: input.rootDir, files });
}

function isPrivateGoModuleReference(
  reference: DependencyReference,
  patterns: readonly string[]
): boolean {
  return (
    reference.ecosystem === "go" &&
    patterns.some((pattern) =>
      splitGoPrivatePatternList(pattern).some((splitPattern) =>
        matchesGoPrivateModulePattern(reference.name, splitPattern)
      )
    )
  );
}

function selectBestReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  const byPackage = new Map<string, DependencyReference>();

  for (const reference of references) {
    const key = referenceKey(reference);
    const existing = byPackage.get(key);
    if (existing === undefined || referenceScore(reference) < referenceScore(existing)) {
      byPackage.set(key, reference);
    }
  }

  return [...byPackage.values()].sort(
    (left, right) =>
      left.ecosystem.localeCompare(right.ecosystem) ||
      left.name.localeCompare(right.name)
  );
}

function referenceKey(reference: DependencyReference): string {
  return `${reference.ecosystem}:${reference.name}`;
}

function referenceScore(reference: DependencyReference): number {
  const sourceKindScore = {
    manifest: 0,
    lockfile: reference.isDirect ? 1 : 2,
    shell: 3,
    docs: 4
  } satisfies Record<DependencyReference["sourceKind"], number>;

  return sourceKindScore[reference.sourceKind];
}

async function mapWithConcurrency<Input, Output>(
  inputs: readonly Input[],
  concurrency: number,
  mapper: (input: Input) => Promise<Output>
): Promise<Output[]> {
  const outputs = new Array<Output>(inputs.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
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
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    })
  );

  return outputs;
}

function normalizedConcurrency(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input)) {
    return defaultRegistryConcurrency;
  }

  return Math.max(1, Math.floor(input));
}
