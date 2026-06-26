import type { ConfigWarning, DependencyReference } from "../core/types.js";
export declare function filterNugetReferencesBySourcePolicy(input: {
    rootDir: string;
    references: readonly DependencyReference[];
}): Promise<{
    references: DependencyReference[];
    warnings: ConfigWarning[];
}>;
