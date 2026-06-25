import type { Finding, RegistryPackageFound, SlopLockConfig } from "./types.js";
export declare function buildPackageNotFoundFinding(reference: {
    name: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: "manifest" | "lockfile" | "docs" | "shell";
}): Finding;
export declare function buildPackageTooNewFinding(reference: {
    name: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: "manifest" | "lockfile" | "docs" | "shell";
}, registryPackage: RegistryPackageFound, config: SlopLockConfig, now: Date): Finding | undefined;
export declare function applySuppressions(findings: readonly Finding[], config: SlopLockConfig): Finding[];
