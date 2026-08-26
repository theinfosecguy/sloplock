import type { Ecosystem, Severity } from "../core/types.js";
export type OutputFormat = "text" | "json" | "markdown";
export type CheckArgs = {
    ecosystem: Ecosystem;
    names: string[];
    format: "text" | "json";
    failOn?: Exclude<Severity, "low">;
    config?: string;
    failClosed: boolean;
};
export type CliArgs = {
    path: string;
    format: OutputFormat;
    failOn?: Exclude<Severity, "low">;
    ecosystem?: Ecosystem;
    changedOnly: boolean;
    base?: string;
    config?: string;
    failClosed: boolean;
    hook: boolean;
    check?: CheckArgs;
    help: boolean;
    helpOutput?: string;
    version: boolean;
};
export declare function parseCliArgs(argv: readonly string[]): CliArgs;
export declare function helpText(): string;
