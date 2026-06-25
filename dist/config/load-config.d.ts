import type { ConfigWarning, SlopLockConfig } from "../core/types.js";
type LoadConfigOptions = {
    rootDir: string;
    configPath?: string;
    failOn?: "medium" | "high";
    now: Date;
    isCi?: boolean;
};
type LoadedConfig = {
    config: SlopLockConfig;
    warnings: ConfigWarning[];
};
export declare function loadConfig(options: LoadConfigOptions): Promise<LoadedConfig>;
export {};
