import type { Ecosystem, Severity } from "../core/types.js";
export type ActionInputs = {
    path: string;
    failOn: Exclude<Severity, "low">;
    ecosystems?: readonly Ecosystem[];
    changedOnly: boolean;
    base?: string;
    config?: string;
    comment: boolean;
    githubToken?: string;
    failClosed: boolean;
};
export declare function readActionInputs(): ActionInputs;
export declare function ecosystemsInput(input: string): {
    ecosystems?: readonly Ecosystem[];
};
