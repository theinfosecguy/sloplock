import type { Ecosystem, RegistryClient, RegistryResult } from "../core/types.js";
type RubyGemsRegistryClientOptions = {
    timeoutMs?: number;
    retries?: number;
    userAgent?: string;
    fetchImpl?: typeof fetch;
};
export declare class RubyGemsRegistryClient implements RegistryClient {
    private readonly timeoutMs;
    private readonly retries;
    private readonly userAgent;
    private readonly fetchImpl;
    private readonly cache;
    constructor(options?: RubyGemsRegistryClientOptions);
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
    private getPackageUncached;
    private fetchPackage;
}
export {};
