import type { Ecosystem, Severity } from "../core/types.js";
export type OutputFormat = "text" | "json" | "markdown";
export type CliArgs = {
    path: string;
    format: OutputFormat;
    failOn?: Exclude<Severity, "low">;
    ecosystem?: Ecosystem;
    changedOnly: boolean;
    base?: string;
    config?: string;
    failClosed: boolean;
    help: boolean;
    version: boolean;
};
export declare function parseCliArgs(argv: readonly string[]): CliArgs;
export declare function helpText(): string;
