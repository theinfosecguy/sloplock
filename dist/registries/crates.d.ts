import type { Ecosystem, RegistryClient, RegistryResult } from "../core/types.js";
type CratesRegistryClientOptions = {
    timeoutMs?: number;
    retries?: number;
    userAgent?: string;
    fetchImpl?: typeof fetch;
};
export declare class CratesRegistryClient implements RegistryClient {
    private readonly timeoutMs;
    private readonly retries;
    private readonly userAgent;
    private readonly fetchImpl;
    private readonly cache;
    constructor(options?: CratesRegistryClientOptions);
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
    private getPackageUncached;
    private fetchPackage;
}
export {};
