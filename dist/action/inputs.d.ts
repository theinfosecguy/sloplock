import type { Severity } from "../core/types.js";
export type ActionInputs = {
    path: string;
    failOn: Exclude<Severity, "low">;
    changedOnly: boolean;
    base?: string;
    config?: string;
    comment: boolean;
    githubToken?: string;
    failClosed: boolean;
};
export declare function readActionInputs(): ActionInputs;
