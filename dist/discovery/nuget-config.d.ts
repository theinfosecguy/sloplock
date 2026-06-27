import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function filterNugetReferencesBySourcePolicy(input: {
    rootDir: string;
    references: readonly DependencyReference[];
    privatePackages?: readonly string[];
}): Promise<{
    references: DependencyReference[];
    warnings: ConfigWarning[];
}>;
