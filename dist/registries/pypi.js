const pypiRegistryUrl = "https://pypi.org/pypi";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
export class PypiRegistryClient {
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
    async getPackage(reference) {
        if (reference.ecosystem !== "pypi") {
            return {
                status: "unsupported",
                ecosystem: reference.ecosystem,
                name: reference.name,
                message: "PyPI registry client only supports PyPI packages.",
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
            await sleep(100 * (attempt + 1));
        }
        return (lastFailure ?? {
            status: "network_error",
            ecosystem: "pypi",
            name,
            message: "PyPI registry request failed without a response.",
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
                return { status: "not_found", ecosystem: "pypi", name };
            }
            if (response.status === 429) {
                return failure(name, "rate_limited", "PyPI registry rate limit exceeded.", true);
            }
            if (response.status >= 500) {
                return failure(name, "server_error", `PyPI registry returned HTTP ${response.status}.`, true);
            }
            if (!response.ok) {
                return failure(name, "network_error", `PyPI registry returned HTTP ${response.status}.`, false);
            }
            const metadata = await response.json();
            return parseMetadata(name, metadata);
        }
        catch (error) {
            const message = error instanceof Error && error.name === "AbortError"
                ? "PyPI registry request timed out."
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
    if (!isPypiMetadata(metadata)) {
        return failure(name, "invalid_response", "PyPI registry returned invalid package metadata.", false);
    }
    const firstPublishedAt = firstPublishedDate(metadata);
    const found = {
        status: "found",
        ecosystem: "pypi",
        name,
        registryUrl: registryPackageUrl(name)
    };
    return firstPublishedAt === undefined
        ? found
        : { ...found, firstPublishedAt };
}
function firstPublishedDate(metadata) {
    const uploadDates = [
        ...uploadDatesFromReleases(metadata.releases),
        ...uploadDatesFromFiles(metadata.urls)
    ].sort((left, right) => left.getTime() - right.getTime());
    return uploadDates[0];
}
function uploadDatesFromReleases(releases) {
    if (releases === undefined) {
        return [];
    }
    return Object.values(releases).flatMap((files) => uploadDatesFromFiles(files));
}
function uploadDatesFromFiles(files) {
    if (files === undefined) {
        return [];
    }
    return files
        .map((file) => dateFromString(file.upload_time_iso_8601 ?? file.upload_time))
        .filter((date) => date !== undefined);
}
function dateFromString(input) {
    if (input === undefined) {
        return undefined;
    }
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function isPypiMetadata(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const metadata = input;
    return (isOptionalReleaseMap(metadata.releases) &&
        isOptionalFileArray(metadata.urls));
}
function isOptionalReleaseMap(input) {
    if (input === undefined) {
        return true;
    }
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    return Object.values(input).every(isOptionalFileArray);
}
function isOptionalFileArray(input) {
    if (input === undefined) {
        return true;
    }
    if (!Array.isArray(input)) {
        return false;
    }
    return input.every((file) => {
        if (typeof file !== "object" || file === null || Array.isArray(file)) {
            return false;
        }
        const uploadTime = file.upload_time;
        const uploadTimeIso = file
            .upload_time_iso_8601;
        return ((uploadTime === undefined || typeof uploadTime === "string") &&
            (uploadTimeIso === undefined || typeof uploadTimeIso === "string"));
    });
}
function registryPackageUrl(name) {
    return `${pypiRegistryUrl}/${encodeURIComponent(name)}/json`;
}
function failure(name, status, message, retryable) {
    return {
        status,
        ecosystem: "pypi",
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
//# sourceMappingURL=pypi.js.map