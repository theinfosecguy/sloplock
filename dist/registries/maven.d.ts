import type { Ecosystem, RegistryClient, RegistryResult } from "../core/types.js";
type MavenCentralRegistryClientOptions = {
    timeoutMs?: number;
    retries?: number;
    userAgent?: string;
    fetchImpl?: typeof fetch;
};
export declare class MavenCentralRegistryClient implements RegistryClient {
    private readonly timeoutMs;
    private readonly retries;
    private readonly userAgent;
    private readonly fetchImpl;
    private readonly cache;
    constructor(options?: MavenCentralRegistryClientOptions);
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
    private getPackageUncached;
    private fetchPackage;
    private fetchPage;
}
export {};
