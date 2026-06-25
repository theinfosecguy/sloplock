import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function discoverDependencyFiles(rootDir: string): Promise<string[]>;
export declare function parseWorkspaceFiles(input: {
    rootDir: string;
    files: readonly string[];
}): Promise<{
    references: DependencyReference[];
    warnings: ConfigWarning[];
}>;
