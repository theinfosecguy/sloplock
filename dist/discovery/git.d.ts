import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function parseChangedDependencyReferences(input: {
    rootDir: string;
    baseRef?: string;
}): Promise<{
    references: DependencyReference[];
    warnings: ConfigWarning[];
}>;
