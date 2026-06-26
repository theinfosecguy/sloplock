import type { DependencyReference, SourceKind } from "../core/types.js";
export type ParseDependencyFileOptions = {
    sourceFile: string;
    content: string;
};
export type ParsedDependencyFile = {
    references: DependencyReference[];
    warnings: string[];
    includedFiles?: string[];
};
export declare function lineNumberForPattern(content: string, pattern: RegExp): number | undefined;
export declare function makeNpmReference(input: {
    name: string;
    versionRange?: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: SourceKind;
    isDirect: boolean;
}): DependencyReference;
export declare function makePypiReference(input: {
    name: string;
    versionRange?: string;
    sourceFile: string;
    sourceLine?: number;
    sourceKind: SourceKind;
    isDirect: boolean;
}): DependencyReference;
export declare function isRecord(input: unknown): input is Record<string, unknown>;
export declare function toPosixPath(filePath: string): string;
