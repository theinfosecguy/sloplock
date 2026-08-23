import type { Ecosystem, Severity } from "../core/types.js";
export type OutputFormat = "text" | "json" | "markdown";
export type CliArgs = {
    command: "help";
} | {
    command: "version";
} | {
    command: "scan";
    path: string;
    format: OutputFormat;
    failOn?: Exclude<Severity, "low">;
    ecosystem?: Ecosystem;
    changedOnly: boolean;
    base?: string;
    config?: string;
    failClosed: boolean;
} | {
    command: "init";
    path: string;
};
export declare function parseCliArgs(argv: readonly string[]): CliArgs;
export declare function helpText(): string;
