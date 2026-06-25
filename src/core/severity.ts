import type { Severity } from "./types.js";

const severityRank: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2
};

export function isAtOrAboveSeverity(
  severity: Severity,
  threshold: Exclude<Severity, "low">
): boolean {
  return severityRank[severity] >= severityRank[threshold];
}

export function highestSeverity(
  severities: readonly Severity[]
): Severity | undefined {
  return severities.reduce<Severity | undefined>((highest, severity) => {
    if (highest === undefined) {
      return severity;
    }

    return severityRank[severity] > severityRank[highest] ? severity : highest;
  }, undefined);
}
