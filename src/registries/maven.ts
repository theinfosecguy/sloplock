import { mavenCoordinateParts } from "../core/maven.js";
import type {
  Ecosystem,
  RegistryClient,
  RegistryPackageFailure,
  RegistryPackageFound,
  RegistryResult
} from "../core/types.js";

const mavenCentralSearchUrl = "https://central.sonatype.com/solrsearch/select";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
const rowsPerPage = 200;

type MavenCentralRegistryClientOptions = {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

type MavenCentralDoc = {
  g: string;
  a: string;
  timestamp?: number;
};

type MavenCentralSearchResponse = {
  response: {
    numFound: number;
    docs: MavenCentralDoc[];
  };
};

export class MavenCentralRegistryClient implements RegistryClient {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, Promise<RegistryResult>>();

  constructor(options: MavenCentralRegistryClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.retries = options.retries ?? defaultRetries;
    this.userAgent = options.userAgent ?? "sloplock/0.1.0";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getPackage(reference: {
    ecosystem: Ecosystem;
    name: string;
  }): Promise<RegistryResult> {
    if (reference.ecosystem !== "maven") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "Maven Central registry client only supports Maven packages.",
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
    const coordinate = mavenCoordinateParts(name);
    if (coordinate === undefined) {
      return failure(
        name,
        "unsupported",
        "Maven package name must be groupId:artifactId.",
        false
      );
    }

    let lastFailure: RegistryPackageFailure | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name, coordinate);
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
        ecosystem: "maven",
        name,
        message: "Maven Central registry request failed without a response.",
        retryable: true
      }
    );
  }

  private async fetchPackage(
    name: string,
    coordinate: { groupId: string; artifactId: string }
  ): Promise<RegistryResult> {
    const docs: MavenCentralDoc[] = [];
    let start = 0;
    let numFound: number | undefined;
    let pageDocs: MavenCentralDoc[] = [];

    do {
      const result = await this.fetchPage(name, coordinate, start);
      if (result.status !== "ok") {
        return result.failure;
      }

      pageDocs = result.metadata.response.docs;
      docs.push(...pageDocs);
      numFound = result.metadata.response.numFound;
      start += rowsPerPage;
    } while (docs.length < numFound && pageDocs.length > 0);

    if (numFound === 0) {
      return { status: "not_found", ecosystem: "maven", name };
    }

    return parseDocs(name, coordinate, docs);
  }

  private async fetchPage(
    name: string,
    coordinate: { groupId: string; artifactId: string },
    start: number
  ): Promise<
    | { status: "ok"; metadata: MavenCentralSearchResponse }
    | { status: "failure"; failure: RegistryPackageFailure }
  > {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetchImpl(searchUrl(coordinate, start), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });

      if (response.status === 429) {
        return {
          status: "failure",
          failure: failure(
            name,
            "rate_limited",
            "Maven Central registry rate limit exceeded.",
            true
          )
        };
      }

      if (response.status >= 500) {
        return {
          status: "failure",
          failure: failure(
            name,
            "server_error",
            `Maven Central registry returned HTTP ${response.status}.`,
            true
          )
        };
      }

      if (!response.ok) {
        return {
          status: "failure",
          failure: failure(
            name,
            "network_error",
            `Maven Central registry returned HTTP ${response.status}.`,
            false
          )
        };
      }

      let metadata: unknown;
      try {
        metadata = await response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          status: "failure",
          failure: failure(
            name,
            "invalid_response",
            `Maven Central registry returned invalid JSON: ${message}`,
            false
          )
        };
      }

      if (!isMavenCentralSearchResponse(metadata)) {
        return {
          status: "failure",
          failure: failure(
            name,
            "invalid_response",
            "Maven Central registry returned invalid package metadata.",
            false
          )
        };
      }

      return { status: "ok", metadata };
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Maven Central registry request timed out."
          : error instanceof Error
            ? error.message
            : String(error);

      return {
        status: "failure",
        failure: failure(name, "network_error", message, true)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseDocs(
  name: string,
  coordinate: { groupId: string; artifactId: string },
  docs: readonly MavenCentralDoc[]
): RegistryResult {
  const exactDocs = docs.filter(
    (doc) => doc.g === coordinate.groupId && doc.a === coordinate.artifactId
  );
  if (exactDocs.length === 0) {
    return { status: "not_found", ecosystem: "maven", name };
  }

  const firstPublishedAt = exactDocs
    .map((doc) => dateFromTimestamp(doc.timestamp))
    .filter((date): date is Date => date !== undefined)
    .sort((left, right) => left.getTime() - right.getTime())[0];
  const found: RegistryPackageFound = {
    status: "found",
    ecosystem: "maven",
    name,
    registryUrl: registryPackageUrl(coordinate)
  };

  return firstPublishedAt === undefined
    ? found
    : { ...found, firstPublishedAt };
}

function searchUrl(
  coordinate: { groupId: string; artifactId: string },
  start: number
): string {
  const url = new URL(mavenCentralSearchUrl);
  url.searchParams.set(
    "q",
    `g:${coordinate.groupId} AND a:${coordinate.artifactId}`
  );
  url.searchParams.set("core", "gav");
  url.searchParams.set("wt", "json");
  url.searchParams.set("rows", String(rowsPerPage));
  url.searchParams.set("start", String(start));
  return url.toString();
}

function registryPackageUrl(input: {
  groupId: string;
  artifactId: string;
}): string {
  return `https://central.sonatype.com/artifact/${encodeURIComponent(
    input.groupId
  )}/${encodeURIComponent(input.artifactId)}`;
}

function dateFromTimestamp(input: number | undefined): Date | undefined {
  if (input === undefined || !Number.isFinite(input)) {
    return undefined;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isMavenCentralSearchResponse(
  input: unknown
): input is MavenCentralSearchResponse {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const response = (input as { response?: unknown }).response;
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    return false;
  }

  const metadata = response as { numFound?: unknown; docs?: unknown };
  return (
    typeof metadata.numFound === "number" &&
    Number.isInteger(metadata.numFound) &&
    metadata.numFound >= 0 &&
    Array.isArray(metadata.docs) &&
    metadata.docs.every(isMavenCentralDoc)
  );
}

function isMavenCentralDoc(input: unknown): input is MavenCentralDoc {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const doc = input as { g?: unknown; a?: unknown; timestamp?: unknown };
  return (
    typeof doc.g === "string" &&
    typeof doc.a === "string" &&
    (doc.timestamp === undefined || typeof doc.timestamp === "number")
  );
}

function failure(
  name: string,
  status: RegistryPackageFailure["status"],
  message: string,
  retryable: boolean
): RegistryPackageFailure {
  return {
    status,
    ecosystem: "maven",
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
