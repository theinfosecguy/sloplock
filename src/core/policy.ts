import { normalizeNpmPackageName } from "./npm.js";
import type {
  AllowRule,
  Finding,
  IgnoreRule,
  RegistryPackageFound,
  RuleId,
  SlopLockConfig
} from "./types.js";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function buildPackageNotFoundFinding(reference: {
  name: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: "manifest" | "lockfile" | "docs" | "shell";
}): Finding {
  const source =
    reference.sourceLine === undefined
      ? { file: reference.sourceFile }
      : { file: reference.sourceFile, line: reference.sourceLine };

  return {
    rule: "package_not_found",
    severity:
      reference.sourceKind === "docs" || reference.sourceKind === "shell"
        ? "medium"
        : "high",
    ecosystem: "npm",
    package: reference.name,
    source,
    evidence: "Package does not exist in the npm registry.",
    recommendation: "Verify the intended package name before installing or merging."
  };
}

export function buildPackageTooNewFinding(
  reference: {
    name: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: "manifest" | "lockfile" | "docs" | "shell";
  },
  registryPackage: RegistryPackageFound,
  config: SlopLockConfig,
  now: Date
): Finding | undefined {
  if (registryPackage.firstPublishedAt === undefined) {
    return undefined;
  }

  const ageDays = Math.floor(
    (now.getTime() - registryPackage.firstPublishedAt.getTime()) /
      millisecondsPerDay
  );

  if (ageDays < 0) {
    return undefined;
  }

  const severity =
    ageDays <= config.cooldown.highDays
      ? "high"
      : ageDays <= config.cooldown.mediumDays
        ? "medium"
        : undefined;

  if (severity === undefined) {
    return undefined;
  }

  const cappedSeverity =
    reference.sourceKind === "docs" || reference.sourceKind === "shell"
      ? "medium"
      : severity;

  const source =
    reference.sourceLine === undefined
      ? { file: reference.sourceFile }
      : { file: reference.sourceFile, line: reference.sourceLine };

  return {
    rule: "package_too_new",
    severity: cappedSeverity,
    ecosystem: "npm",
    package: reference.name,
    source,
    evidence: `Package was first published ${ageDays} days ago. Cooldown policy is ${config.cooldown.mediumDays} days.`,
    recommendation: "Wait for cooldown or add an explicit temporary allow rule."
  };
}

export function applySuppressions(
  findings: readonly Finding[],
  config: SlopLockConfig
): Finding[] {
  return findings.filter((finding) => {
    if (matchesAllow(finding.package, config.allow)) {
      return false;
    }

    return !matchesIgnore(finding.package, finding.rule, config.ignore);
  });
}

function matchesAllow(packageName: string, rules: readonly AllowRule[]): boolean {
  const normalized = normalizeNpmPackageName(packageName);
  return rules.some(
    (rule) =>
      normalized !== undefined &&
      rule.package === normalized
  );
}

function matchesIgnore(
  packageName: string,
  ruleId: RuleId,
  rules: readonly IgnoreRule[]
): boolean {
  const normalized = normalizeNpmPackageName(packageName);
  return rules.some(
    (rule) =>
      normalized !== undefined &&
      rule.package === normalized &&
      rule.rule === ruleId
  );
}
