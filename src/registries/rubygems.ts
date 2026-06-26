import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryPackageFound,
  RegistryResult
} from "../core/types.js";

const rubygemsVersionsUrl = "https://rubygems.org/api/v1/versions";
const rubygemsPackagePageUrl = "https://rubygems.org/gems";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;

type RubyGemsRegistryClientOptions = {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

type RubyGemsVersion = {
  created_at?: string;
};

export class RubyGemsRegistryClient implements RegistryClient {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, Promise<RegistryResult>>();

  constructor(options: RubyGemsRegistryClientOptions = {}) {
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
    if (reference.ecosystem !== "rubygems") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "RubyGems.org registry client only supports RubyGems packages.",
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
        ecosystem: "rubygems",
        name,
        message: "RubyGems.org registry request failed without a response.",
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
      const response = await this.fetchImpl(registryVersionsUrl(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });

      if (response.status === 404) {
        return { status: "not_found", ecosystem: "rubygems", name };
      }

      if (response.status === 429) {
        return failure(
          name,
          "rate_limited",
          "RubyGems.org registry rate limit exceeded.",
          true
        );
      }

      if (response.status >= 500) {
        return failure(
          name,
          "server_error",
          `RubyGems.org registry returned HTTP ${response.status}.`,
          true
        );
      }

      if (!response.ok) {
        return failure(
          name,
          "network_error",
          `RubyGems.org registry returned HTTP ${response.status}.`,
          false
        );
      }

      let metadata: unknown;
      try {
        metadata = await response.json();
      } catch {
        return failure(
          name,
          "invalid_response",
          "RubyGems.org registry returned invalid package metadata.",
          false
        );
      }

      return parseMetadata(name, metadata);
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "RubyGems.org registry request timed out."
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
  if (!isRubyGemsVersionArray(metadata)) {
    return failure(
      name,
      "invalid_response",
      "RubyGems.org registry returned invalid package metadata.",
      false
    );
  }

  const firstPublishedAt = firstPublishedDate(metadata);
  const found: RegistryPackageFound = {
    status: "found",
    ecosystem: "rubygems",
    name,
    registryUrl: registryPackagePageUrlFor(name)
  };

  return firstPublishedAt === undefined
    ? found
    : { ...found, firstPublishedAt };
}

function firstPublishedDate(versions: readonly RubyGemsVersion[]): Date | undefined {
  const publishTimes = versions
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

function isRubyGemsVersionArray(input: unknown): input is RubyGemsVersion[] {
  return Array.isArray(input) && input.every(isRubyGemsVersion);
}

function isRubyGemsVersion(input: unknown): input is RubyGemsVersion {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const version = input as { created_at?: unknown };
  return version.created_at === undefined || typeof version.created_at === "string";
}

function registryVersionsUrl(name: string): string {
  return `${rubygemsVersionsUrl}/${encodeURIComponent(name)}.json`;
}

function registryPackagePageUrlFor(name: string): string {
  return `${rubygemsPackagePageUrl}/${encodeURIComponent(name)}`;
}

function failure(
  name: string,
  status: RegistryPackageFailure["status"],
  message: string,
  retryable: boolean
): RegistryPackageFailure {
  return {
    status,
    ecosystem: "rubygems",
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
