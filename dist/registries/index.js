import { CratesRegistryClient } from "./crates.js";
import { GoProxyRegistryClient } from "./go.js";
import { NpmRegistryClient } from "./npm.js";
import { PypiRegistryClient } from "./pypi.js";
export class DefaultRegistryClient {
    crates;
    go;
    npm;
    pypi;
    constructor(input = {}) {
        this.crates = input.crates ?? new CratesRegistryClient();
        this.go = input.go ?? new GoProxyRegistryClient();
        this.npm = input.npm ?? new NpmRegistryClient();
        this.pypi = input.pypi ?? new PypiRegistryClient();
    }
    getPackage(reference) {
        switch (reference.ecosystem) {
            case "crates":
                return this.crates.getPackage(reference);
            case "go":
                return this.go.getPackage(reference);
            case "npm":
                return this.npm.getPackage(reference);
            case "pypi":
                return this.pypi.getPackage(reference);
        }
    }
}
export function unsupportedRegistryResult(reference) {
    return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: `Unsupported ecosystem: ${reference.ecosystem}.`,
        retryable: false
    };
}
//# sourceMappingURL=index.js.map