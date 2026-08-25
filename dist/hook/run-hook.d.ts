import type { RegistryClient } from "../core/types.js";
export type HookOutcome = {
    exitCode: number;
    stdout: string;
    stderr: string;
};
export declare function runHook(input: {
    stdin: string;
    cwd: string;
    env?: NodeJS.ProcessEnv;
    registryClient?: RegistryClient;
    now?: Date;
}): Promise<HookOutcome>;
