import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryResult
} from "../core/types.js";
import { CratesRegistryClient } from "./crates.js";
import { GoProxyRegistryClient } from "./go.js";
import { MavenCentralRegistryClient } from "./maven.js";
import { NugetRegistryClient } from "./nuget.js";
import { NpmRegistryClient } from "./npm.js";
import { PackagistRegistryClient } from "./packagist.js";
import { PypiRegistryClient } from "./pypi.js";
import { RubyGemsRegistryClient } from "./rubygems.js";

export class DefaultRegistryClient implements RegistryClient {
  private readonly crates: RegistryClient;
  private readonly go: RegistryClient;
  private readonly maven: RegistryClient;
  private readonly npm: RegistryClient;
  private readonly nuget: RegistryClient;
  private readonly packagist: RegistryClient;
  private readonly pypi: RegistryClient;
  private readonly rubygems: RegistryClient;

  constructor(input: {
    crates?: RegistryClient;
    go?: RegistryClient;
    maven?: RegistryClient;
    npm?: RegistryClient;
    nuget?: RegistryClient;
    packagist?: RegistryClient;
    pypi?: RegistryClient;
    rubygems?: RegistryClient;
  } = {}) {
    this.crates = input.crates ?? new CratesRegistryClient();
    this.go = input.go ?? new GoProxyRegistryClient();
    this.maven = input.maven ?? new MavenCentralRegistryClient();
    this.npm = input.npm ?? new NpmRegistryClient();
    this.nuget = input.nuget ?? new NugetRegistryClient();
    this.packagist = input.packagist ?? new PackagistRegistryClient();
    this.pypi = input.pypi ?? new PypiRegistryClient();
    this.rubygems = input.rubygems ?? new RubyGemsRegistryClient();
  }

  getPackage(reference: {
    ecosystem: Ecosystem;
    name: string;
  }): Promise<RegistryResult> {
    switch (reference.ecosystem) {
      case "crates":
        return this.crates.getPackage(reference);
      case "go":
        return this.go.getPackage(reference);
      case "maven":
        return this.maven.getPackage(reference);
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

export function unsupportedRegistryResult(reference: {
  ecosystem: Ecosystem;
  name: string;
}): RegistryPackageFailure {
  return {
    status: "unsupported",
    ecosystem: reference.ecosystem,
    name: reference.name,
    message: `Unsupported ecosystem: ${reference.ecosystem}.`,
    retryable: false
  };
}
