import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function isSupportedDependencyFile(filePath: string): boolean;
export declare function parseDependencyFile(input: {
    sourceFile: string;
    content: string;
}): {
    references: DependencyReference[];
    warnings: ConfigWarning[];
};
