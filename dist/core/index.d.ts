export { checkPackages, scan } from "./scan.js";
export { isAtOrAboveSeverity, highestSeverity } from "./severity.js";
export { normalizePackageName, registryDisplayName } from "./packages.js";
export { RegistryFailureError, SlopLockError, UsageError } from "./errors.js";
export { DefaultRegistryClient } from "../registries/index.js";
export type { CheckPackagesOptions, CheckPackagesResult, ConfigWarning, DependencyReference, Ecosystem, Finding, PackageCheckFinding, PackageCheckInput, RegistryClient, RegistryPackageFailure, RegistryResult, RuleId, ScanOptions, ScanResult, Severity, SlopLockConfig, SourceKind } from "./types.js";
