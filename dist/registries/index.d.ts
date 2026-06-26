import type { Ecosystem, RegistryClient, RegistryPackageFailure, RegistryResult } from "../core/types.js";
export declare class DefaultRegistryClient implements RegistryClient {
    private readonly crates;
    private readonly go;
    private readonly npm;
    private readonly packagist;
    private readonly pypi;
    constructor(input?: {
        crates?: RegistryClient;
        go?: RegistryClient;
        npm?: RegistryClient;
        packagist?: RegistryClient;
        pypi?: RegistryClient;
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
