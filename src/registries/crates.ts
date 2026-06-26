import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryPackageFound,
  RegistryResult
} from "../core/types.js";

const cratesRegistryUrl = "https://crates.io/api/v1/crates";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;

type CratesRegistryClientOptions = {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

type CratesMetadata = {
  crate: {
    id?: string;
    name?: string;
    created_at?: string;
  };
  versions?: Array<{
    created_at?: string;
  }>;
};

export class CratesRegistryClient implements RegistryClient {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, Promise<RegistryResult>>();

  constructor(options: CratesRegistryClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.retries = options.retries ?? defaultRetries;
    this.userAgent =
      options.userAgent ?? "sloplock/0.1.0 (https://github.com/theinfosecguy/sloplock)";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getPackage(reference: {
    ecosystem: Ecosystem;
    name: string;
  }): Promise<RegistryResult> {
    if (reference.ecosystem !== "crates") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "crates.io registry client only supports Rust crates.",
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

      await sleep(1_000 * (attempt + 1));
    }

    return (
      lastFailure ?? {
        status: "network_error",
        ecosystem: "crates",
        name,
        message: "crates.io registry request failed without a response.",
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
        return { status: "not_found", ecosystem: "crates", name };
      }

      if (response.status === 429) {
        return failure(
          name,
          "rate_limited",
          "crates.io registry rate limit exceeded.",
          true
        );
      }

      if (response.status >= 500) {
        return failure(
          name,
          "server_error",
          `crates.io registry returned HTTP ${response.status}.`,
          true
        );
      }

      if (!response.ok) {
        return failure(
          name,
          "network_error",
          `crates.io registry returned HTTP ${response.status}.`,
          false
        );
      }

      const metadata = await response.json();
      return parseMetadata(name, metadata);
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "crates.io registry request timed out."
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
  if (!isCratesMetadata(metadata)) {
    return failure(
      name,
      "invalid_response",
      "crates.io registry returned invalid crate metadata.",
      false
    );
  }

  const firstPublishedAt = firstPublishedDate(metadata);
  const found: RegistryPackageFound = {
    status: "found",
    ecosystem: "crates",
    name,
    registryUrl: registryPackageUrl(name)
  };

  return firstPublishedAt === undefined
    ? found
    : { ...found, firstPublishedAt };
}

function firstPublishedDate(metadata: CratesMetadata): Date | undefined {
  const crateCreated = dateFromString(metadata.crate.created_at);
  if (crateCreated !== undefined) {
    return crateCreated;
  }

  const publishTimes = (metadata.versions ?? [])
    .map((version) => dateFromString(version.created_at))
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

function isCratesMetadata(input: unknown): input is CratesMetadata {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const metadata = input as { crate?: unknown; versions?: unknown };
  if (
    typeof metadata.crate !== "object" ||
    metadata.crate === null ||
    Array.isArray(metadata.crate)
  ) {
    return false;
  }

  if (metadata.versions !== undefined && !Array.isArray(metadata.versions)) {
    return false;
  }

  const crate = metadata.crate as { id?: unknown; name?: unknown; created_at?: unknown };
  const versions = metadata.versions as unknown[] | undefined;

  return (
    (crate.id === undefined || typeof crate.id === "string") &&
    (crate.name === undefined || typeof crate.name === "string") &&
    (crate.created_at === undefined || typeof crate.created_at === "string") &&
    (versions ?? []).every(isCratesVersion)
  );
}

function isCratesVersion(input: unknown): input is { created_at?: string } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const version = input as { created_at?: unknown };
  return version.created_at === undefined || typeof version.created_at === "string";
}

function registryPackageUrl(name: string): string {
  return `${cratesRegistryUrl}/${encodeURIComponent(name)}`;
}

function failure(
  name: string,
  status: RegistryPackageFailure["status"],
  message: string,
  retryable: boolean
): RegistryPackageFailure {
  return {
    status,
    ecosystem: "crates",
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
