import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function isSupportedDependencyFile(filePath: string): boolean;
export declare function parseDependencyFile(input: {
    sourceFile: string;
    content: string;
    format?: "python-requirements";
}): {
    references: DependencyReference[];
    warnings: ConfigWarning[];
    includedFiles?: string[];
};
