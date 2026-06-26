import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryPackageFound,
  RegistryResult
} from "../core/types.js";

const packagistApiUrl = "https://packagist.org/packages";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;

type PackagistRegistryClientOptions = {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

type PackagistVersion = {
  time?: string;
};

type PackagistMetadata = {
  package: {
    name?: string;
    time?: string;
    versions?: Record<string, PackagistVersion>;
  };
};

export class PackagistRegistryClient implements RegistryClient {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, Promise<RegistryResult>>();

  constructor(options: PackagistRegistryClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.retries = options.retries ?? defaultRetries;
    this.userAgent = options.userAgent ?? "sloplock/0.1.0";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getPackage(reference: {
    ecosystem: Ecosystem;
    name: string;
  }): Promise<RegistryResult> {
    if (reference.ecosystem !== "packagist") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "Packagist registry client only supports Packagist packages.",
        retryable: false
      };
    }

    const cached = this.cache.get(reference.name);
    if (cached !== undefined) {
      return cached;
    }

    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }

  private async getPackageUncached(name: string): Promise<RegistryResult> {
    let lastFailure: RegistryPackageFailure | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }

      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }

      await sleep(100 * (attempt + 1));
    }

    return (
      lastFailure ?? {
        status: "network_error",
        ecosystem: "packagist",
        name,
        message: "Packagist registry request failed without a response.",
        retryable: true
      }
    );
  }

  private async fetchPackage(name: string): Promise<RegistryResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetchImpl(registryPackageUrl(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });

      if (response.status === 404) {
        return { status: "not_found", ecosystem: "packagist", name };
      }

      if (response.status === 429) {
        return failure(
          name,
          "rate_limited",
          "Packagist registry rate limit exceeded.",
          true
        );
      }

      if (response.status >= 500) {
        return failure(
          name,
          "server_error",
          `Packagist registry returned HTTP ${response.status}.`,
          true
        );
      }

      if (!response.ok) {
        return failure(
          name,
          "network_error",
          `Packagist registry returned HTTP ${response.status}.`,
          false
        );
      }

      let metadata: unknown;
      try {
        metadata = await response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return failure(
          name,
          "invalid_response",
          `Packagist registry returned invalid JSON: ${message}`,
          false
        );
      }

      return parseMetadata(name, metadata);
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Packagist registry request timed out."
          : error instanceof Error
            ? error.message
            : String(error);

      return failure(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseMetadata(name: string, metadata: unknown): RegistryResult {
  if (!isPackagistMetadata(metadata)) {
    return failure(
      name,
      "invalid_response",
      "Packagist registry returned invalid package metadata.",
      false
    );
  }

  const firstPublishedAt = firstPublishedDate(metadata);
  const found: RegistryPackageFound = {
    status: "found",
    ecosystem: "packagist",
    name,
    registryUrl: registryPackageUrl(name)
  };

  return firstPublishedAt === undefined
    ? found
    : { ...found, firstPublishedAt };
}

function firstPublishedDate(metadata: PackagistMetadata): Date | undefined {
  const created = dateFromString(metadata.package.time);
  if (created !== undefined) {
    return created;
  }

  const publishTimes = Object.values(metadata.package.versions ?? {})
    .map((version) => dateFromString(version.time))
    .filter((date): date is Date => date !== undefined)
    .sort((left, right) => left.getTime() - right.getTime());

  return publishTimes[0];
}

function dateFromString(input: string | undefined): Date | undefined {
  if (input === undefined) {
    return undefined;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isPackagistMetadata(input: unknown): input is PackagistMetadata {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const metadata = input as { package?: unknown };
  if (
    typeof metadata.package !== "object" ||
    metadata.package === null ||
    Array.isArray(metadata.package)
  ) {
    return false;
  }

  const packageMetadata = metadata.package as {
    name?: unknown;
    time?: unknown;
    versions?: unknown;
  };

  return (
    (packageMetadata.name === undefined ||
      typeof packageMetadata.name === "string") &&
    (packageMetadata.time === undefined ||
      typeof packageMetadata.time === "string") &&
    isOptionalVersionMap(packageMetadata.versions)
  );
}

function isOptionalVersionMap(
  input: unknown
): input is Record<string, PackagistVersion> | undefined {
  if (input === undefined) {
    return true;
  }

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  return Object.values(input).every(isPackagistVersion);
}

function isPackagistVersion(input: unknown): input is PackagistVersion {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const version = input as { time?: unknown };
  return version.time === undefined || typeof version.time === "string";
}

function registryPackageUrl(name: string): string {
  const [vendor, packageName] = name.split("/", 2);
  return `${packagistApiUrl}/${encodeURIComponent(
    vendor ?? name
  )}/${encodeURIComponent(packageName ?? "")}.json`;
}

function failure(
  name: string,
  status: RegistryPackageFailure["status"],
  message: string,
  retryable: boolean
): RegistryPackageFailure {
  return {
    status,
    ecosystem: "packagist",
    name,
    message,
    retryable
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}
