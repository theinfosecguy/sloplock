import type { Ecosystem, RegistryClient, RegistryResult } from "../core/types.js";
type GoProxyRegistryClientOptions = {
    proxyUrl?: string;
    timeoutMs?: number;
    retries?: number;
    maxVersionInfoRequests?: number;
    userAgent?: string;
    fetchImpl?: typeof fetch;
};
export declare class GoProxyRegistryClient implements RegistryClient {
    private readonly proxyUrl;
    private readonly timeoutMs;
    private readonly retries;
    private readonly maxVersionInfoRequests;
    private readonly userAgent;
    private readonly fetchImpl;
    private readonly cache;
    constructor(options?: GoProxyRegistryClientOptions);
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
    private getPackageUncached;
    private foundFromVersionList;
    private fetchVersionList;
    private fetchVersionInfo;
    private fetchProxyPath;
    private fetchProxyPathOnce;
    private moduleProxyUrl;
}
export {};
