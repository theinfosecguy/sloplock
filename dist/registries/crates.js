const cratesRegistryUrl = "https://crates.io/api/v1/crates";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
export class CratesRegistryClient {
    timeoutMs;
    retries;
    userAgent;
    fetchImpl;
    cache = new Map();
    constructor(options = {}) {
        this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
        this.retries = options.retries ?? defaultRetries;
        this.userAgent =
            options.userAgent ?? "sloplock/0.1.0 (https://github.com/theinfosecguy/sloplock)";
        this.fetchImpl = options.fetchImpl ?? fetch;
    }
    async getPackage(reference) {
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
    async getPackageUncached(name) {
        let lastFailure;
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
        return (lastFailure ?? {
            status: "network_error",
            ecosystem: "crates",
            name,
            message: "crates.io registry request failed without a response.",
            retryable: true
        });
    }
    async fetchPackage(name) {
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
                return failure(name, "rate_limited", "crates.io registry rate limit exceeded.", true);
            }
            if (response.status >= 500) {
                return failure(name, "server_error", `crates.io registry returned HTTP ${response.status}.`, true);
            }
            if (!response.ok) {
                return failure(name, "network_error", `crates.io registry returned HTTP ${response.status}.`, false);
            }
            const metadata = await response.json();
            return parseMetadata(name, metadata);
        }
        catch (error) {
            const message = error instanceof Error && error.name === "AbortError"
                ? "crates.io registry request timed out."
                : error instanceof Error
                    ? error.message
                    : String(error);
            return failure(name, "network_error", message, true);
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
function parseMetadata(name, metadata) {
    if (!isCratesMetadata(metadata)) {
        return failure(name, "invalid_response", "crates.io registry returned invalid crate metadata.", false);
    }
    const firstPublishedAt = firstPublishedDate(metadata);
    const found = {
        status: "found",
        ecosystem: "crates",
        name,
        registryUrl: registryPackageUrl(name)
    };
    return firstPublishedAt === undefined
        ? found
        : { ...found, firstPublishedAt };
}
function firstPublishedDate(metadata) {
    const crateCreated = dateFromString(metadata.crate.created_at);
    if (crateCreated !== undefined) {
        return crateCreated;
    }
    const publishTimes = (metadata.versions ?? [])
        .map((version) => dateFromString(version.created_at))
        .filter((date) => date !== undefined)
        .sort((left, right) => left.getTime() - right.getTime());
    return publishTimes[0];
}
function dateFromString(input) {
    if (input === undefined) {
        return undefined;
    }
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function isCratesMetadata(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const metadata = input;
    if (typeof metadata.crate !== "object" ||
        metadata.crate === null ||
        Array.isArray(metadata.crate)) {
        return false;
    }
    if (metadata.versions !== undefined && !Array.isArray(metadata.versions)) {
        return false;
    }
    const crate = metadata.crate;
    const versions = metadata.versions;
    return ((crate.id === undefined || typeof crate.id === "string") &&
        (crate.name === undefined || typeof crate.name === "string") &&
        (crate.created_at === undefined || typeof crate.created_at === "string") &&
        (versions ?? []).every(isCratesVersion));
}
function isCratesVersion(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const version = input;
    return version.created_at === undefined || typeof version.created_at === "string";
}
function registryPackageUrl(name) {
    return `${cratesRegistryUrl}/${encodeURIComponent(name)}`;
}
function failure(name, status, message, retryable) {
    return {
        status,
        ecosystem: "crates",
        name,
        message,
        retryable
    };
}
function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
//# sourceMappingURL=crates.js.map