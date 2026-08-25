import type { DependencyReference, Finding, RegistryPackageFound, SlopLockConfig } from "./types.js";
type FindingReference = Pick<DependencyReference, "ecosystem" | "name">;
export type UnsourcedFinding = Omit<Finding, "source">;
export declare function buildPackageNotFoundFinding(reference: FindingReference): UnsourcedFinding;
export declare function buildPackageTooNewFinding(reference: FindingReference, registryPackage: RegistryPackageFound, config: SlopLockConfig, now: Date): UnsourcedFinding | undefined;
export declare function applySuppressions<T extends Pick<Finding, "ecosystem" | "package" | "rule">>(findings: readonly T[], config: SlopLockConfig): T[];
export {};
