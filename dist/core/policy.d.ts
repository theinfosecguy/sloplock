import type { Ecosystem, Finding, RegistryPackageFound, SourceKind, SlopLockConfig } from "./types.js";
export declare function buildPackageNotFoundFinding(reference: {
    ecosystem: Ecosystem;
    name: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: SourceKind;
}): Finding;
export declare function buildPackageTooNewFinding(reference: {
    ecosystem: Ecosystem;
    name: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: SourceKind;
}, registryPackage: RegistryPackageFound, config: SlopLockConfig, now: Date): Finding | undefined;
export declare function applySuppressions(findings: readonly Finding[], config: SlopLockConfig): Finding[];
