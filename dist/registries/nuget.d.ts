import type { Ecosystem, RegistryClient, RegistryResult } from "../core/types.js";
type NugetRegistryClientOptions = {
    timeoutMs?: number;
    retries?: number;
    userAgent?: string;
    fetchImpl?: typeof fetch;
};
export declare class NugetRegistryClient implements RegistryClient {
    private readonly timeoutMs;
    private readonly retries;
    private readonly userAgent;
    private readonly fetchImpl;
    private readonly cache;
    private serviceIndex;
    constructor(options?: NugetRegistryClientOptions);
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
    private getPackageUncached;
    private fetchPackage;
    private registrationBaseUrl;
    private fetchServiceIndex;
    private parseRegistrationIndex;
    private fetchJson;
}
export {};
