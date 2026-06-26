import type { Ecosystem, RegistryClient, RegistryPackageFailure, RegistryResult } from "../core/types.js";
export declare class DefaultRegistryClient implements RegistryClient {
    private readonly crates;
    private readonly go;
    private readonly npm;
    private readonly nuget;
    private readonly packagist;
    private readonly pypi;
    private readonly rubygems;
    constructor(input?: {
        crates?: RegistryClient;
        go?: RegistryClient;
        npm?: RegistryClient;
        nuget?: RegistryClient;
        packagist?: RegistryClient;
        pypi?: RegistryClient;
        rubygems?: RegistryClient;
    });
    getPackage(reference: {
        ecosystem: Ecosystem;
        name: string;
    }): Promise<RegistryResult>;
}
export declare function unsupportedRegistryResult(reference: {
    ecosystem: Ecosystem;
    name: string;
}): RegistryPackageFailure;
