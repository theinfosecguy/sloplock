import { CratesRegistryClient } from "./crates.js";
import { GoProxyRegistryClient } from "./go.js";
import { NugetRegistryClient } from "./nuget.js";
import { NpmRegistryClient } from "./npm.js";
import { PackagistRegistryClient } from "./packagist.js";
import { PypiRegistryClient } from "./pypi.js";
import { RubyGemsRegistryClient } from "./rubygems.js";
export class DefaultRegistryClient {
    crates;
    go;
    npm;
    nuget;
    packagist;
    pypi;
    rubygems;
    constructor(input = {}) {
        this.crates = input.crates ?? new CratesRegistryClient();
        this.go = input.go ?? new GoProxyRegistryClient();
        this.npm = input.npm ?? new NpmRegistryClient();
        this.nuget = input.nuget ?? new NugetRegistryClient();
        this.packagist = input.packagist ?? new PackagistRegistryClient();
        this.pypi = input.pypi ?? new PypiRegistryClient();
        this.rubygems = input.rubygems ?? new RubyGemsRegistryClient();
    }
    getPackage(reference) {
        switch (reference.ecosystem) {
            case "crates":
                return this.crates.getPackage(reference);
            case "go":
                return this.go.getPackage(reference);
            case "npm":
                return this.npm.getPackage(reference);
            case "nuget":
                return this.nuget.getPackage(reference);
            case "packagist":
                return this.packagist.getPackage(reference);
            case "pypi":
                return this.pypi.getPackage(reference);
            case "rubygems":
                return this.rubygems.getPackage(reference);
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