import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryResult
} from "../core/types.js";
import { GoProxyRegistryClient } from "./go.js";
import { NpmRegistryClient } from "./npm.js";
import { PypiRegistryClient } from "./pypi.js";

export class DefaultRegistryClient implements RegistryClient {
  private readonly go: RegistryClient;
  private readonly npm: RegistryClient;
  private readonly pypi: RegistryClient;

  constructor(input: {
    go?: RegistryClient;
    npm?: RegistryClient;
    pypi?: RegistryClient;
  } = {}) {
    this.go = input.go ?? new GoProxyRegistryClient();
    this.npm = input.npm ?? new NpmRegistryClient();
    this.pypi = input.pypi ?? new PypiRegistryClient();
  }

  getPackage(reference: {
    ecosystem: Ecosystem;
    name: string;
  }): Promise<RegistryResult> {
    switch (reference.ecosystem) {
      case "go":
        return this.go.getPackage(reference);
      case "npm":
        return this.npm.getPackage(reference);
      case "pypi":
        return this.pypi.getPackage(reference);
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
