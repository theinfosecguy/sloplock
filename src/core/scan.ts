import path from "node:path";
import { loadConfig } from "../config/load-config.js";
import {
  discoverDependencyFiles,
  parseWorkspaceFiles
} from "../discovery/find-files.js";
import { parseChangedDependencyReferences } from "../discovery/git.js";
import { NpmRegistryClient } from "../registries/npm.js";
import {
  applySuppressions,
  buildPackageNotFoundFinding,
  buildPackageTooNewFinding
} from "./policy.js";
import type {
  ConfigWarning,
  DependencyReference,
  Finding,
  RegistryPackageFailure,
  ScanOptions,
  ScanResult
} from "./types.js";

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
  const bestReferences = selectBestReferences(parsed.references);
  const registryClient = options.registryClient ?? new NpmRegistryClient();
  const findings: Finding[] = [];
  const registryFailures: RegistryPackageFailure[] = [];

  for (const reference of bestReferences) {
    const registryPackage = await registryClient.getPackage(reference.name);

    switch (registryPackage.status) {
      case "found": {
        const finding = buildPackageTooNewFinding(
          reference,
          registryPackage,
          loadedConfig.config,
          now
        );
        if (finding !== undefined) {
          findings.push(finding);
        }

        if (registryPackage.firstPublishedAt === undefined) {
          warnings.push({
            message: `Package ${reference.name} returned no first publish timestamp; cooldown skipped.`
          });
        }
        break;
      }
      case "not_found":
        findings.push(buildPackageNotFoundFinding(reference));
        break;
      default:
        registryFailures.push(registryPackage);
        warnings.push({
          message: `Registry check failed for ${reference.name}: ${registryPackage.message}`
        });
        break;
    }
  }

  return {
    findings: applySuppressions(findings, loadedConfig.config),
    warnings,
    registryFailures,
    scannedDependencies: bestReferences.length,
    failOn: loadedConfig.config.failOn
  };
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

function selectBestReferences(
  references: readonly DependencyReference[]
): DependencyReference[] {
  const byPackage = new Map<string, DependencyReference>();

  for (const reference of references) {
    const existing = byPackage.get(reference.name);
    if (existing === undefined || referenceScore(reference) < referenceScore(existing)) {
      byPackage.set(reference.name, reference);
    }
  }

  return [...byPackage.values()].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
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
