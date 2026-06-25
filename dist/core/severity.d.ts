import type { Severity } from "./types.js";
export declare function isAtOrAboveSeverity(severity: Severity, threshold: Exclude<Severity, "low">): boolean;
export declare function highestSeverity(severities: readonly Severity[]): Severity | undefined;
