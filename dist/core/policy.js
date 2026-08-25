import { normalizePackageName, registryDisplayName } from "./packages.js";
const millisecondsPerDay = 24 * 60 * 60 * 1000;
export function buildPackageNotFoundFinding(reference) {
    return {
        rule: "package_not_found",
        severity: "high",
        ecosystem: reference.ecosystem,
        package: reference.name,
        evidence: `Package does not exist in the ${registryDisplayName(reference.ecosystem)} registry.`,
        recommendation: "Verify the intended package name before installing or merging."
    };
}
export function buildPackageTooNewFinding(reference, registryPackage, config, now) {
    if (registryPackage.firstPublishedAt === undefined) {
        return undefined;
    }
    const ageDays = Math.floor((now.getTime() - registryPackage.firstPublishedAt.getTime()) /
        millisecondsPerDay);
    if (ageDays < 0) {
        return undefined;
    }
    const severity = ageDays <= config.cooldown.highDays
        ? "high"
        : ageDays <= config.cooldown.mediumDays
            ? "medium"
            : undefined;
    if (severity === undefined) {
        return undefined;
    }
    return {
        rule: "package_too_new",
        severity,
        ecosystem: reference.ecosystem,
        package: reference.name,
        evidence: `Package was first published ${ageDays} days ago. Cooldown policy is ${config.cooldown.mediumDays} days.`,
        recommendation: "Wait for cooldown or add an explicit temporary allow rule."
    };
}
export function applySuppressions(findings, config) {
    return findings.filter((finding) => {
        if (matchesAllow(finding.ecosystem, finding.package, config.allow)) {
            return false;
        }
        return !matchesIgnore(finding.ecosystem, finding.package, finding.rule, config.ignore);
    });
}
function matchesAllow(ecosystem, packageName, rules) {
    const normalized = normalizePackageName(ecosystem, packageName);
    return rules.some((rule) => normalized !== undefined &&
        rule.ecosystem === ecosystem &&
        rule.package === normalized);
}
function matchesIgnore(ecosystem, packageName, ruleId, rules) {
    const normalized = normalizePackageName(ecosystem, packageName);
    return rules.some((rule) => normalized !== undefined &&
        rule.ecosystem === ecosystem &&
        rule.package === normalized &&
        rule.rule === ruleId);
}
//# sourceMappingURL=policy.js.map