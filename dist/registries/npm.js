const npmRegistryUrl = "https://registry.npmjs.org";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
export class NpmRegistryClient {
    timeoutMs;
    retries;
    userAgent;
    fetchImpl;
    cache = new Map();
    constructor(options = {}) {
        this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
        this.retries = options.retries ?? defaultRetries;
        this.userAgent = options.userAgent ?? "sloplock/0.1.0";
        this.fetchImpl = options.fetchImpl ?? fetch;
    }
    async getPackage(name) {
        const cached = this.cache.get(name);
        if (cached !== undefined) {
            return cached;
        }
        const request = this.getPackageUncached(name);
        this.cache.set(name, request);
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
            await sleep(100 * (attempt + 1));
        }
        return (lastFailure ?? {
            status: "network_error",
            ecosystem: "npm",
            name,
            message: "npm registry request failed without a response.",
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
                return { status: "not_found", ecosystem: "npm", name };
            }
            if (response.status === 429) {
                return failure(name, "rate_limited", "npm registry rate limit exceeded.", true);
            }
            if (response.status >= 500) {
                return failure(name, "server_error", `npm registry returned HTTP ${response.status}.`, true);
            }
            if (!response.ok) {
                return failure(name, "network_error", `npm registry returned HTTP ${response.status}.`, false);
            }
            const metadata = await response.json();
            return parseMetadata(name, metadata);
        }
        catch (error) {
            const message = error instanceof Error && error.name === "AbortError"
                ? "npm registry request timed out."
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
    if (!isNpmMetadata(metadata)) {
        return failure(name, "invalid_response", "npm registry returned invalid package metadata.", false);
    }
    const firstPublishedAt = firstPublishedDate(metadata);
    const found = {
        status: "found",
        ecosystem: "npm",
        name,
        registryUrl: registryPackageUrl(name)
    };
    return firstPublishedAt === undefined
        ? found
        : { ...found, firstPublishedAt };
}
function firstPublishedDate(metadata) {
    const time = metadata.time;
    if (time === undefined) {
        return undefined;
    }
    const created = dateFromString(time.created);
    if (created !== undefined) {
        return created;
    }
    const publishTimes = Object.entries(time)
        .filter(([key]) => key !== "modified")
        .map(([, value]) => dateFromString(value))
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
function registryPackageUrl(name) {
    return `${npmRegistryUrl}/${encodeURIComponent(name)}`;
}
function failure(name, status, message, retryable) {
    return {
        status,
        ecosystem: "npm",
        name,
        message,
        retryable
    };
}
function isNpmMetadata(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const metadata = input;
    if (metadata.time === undefined) {
        return true;
    }
    if (typeof metadata.time !== "object" ||
        metadata.time === null ||
        Array.isArray(metadata.time)) {
        return false;
    }
    return Object.values(metadata.time).every((value) => typeof value === "string");
}
function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
//# sourceMappingURL=npm.js.map