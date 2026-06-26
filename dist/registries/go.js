import { escapeGoProxyPath } from "../core/go.js";
const defaultProxyUrl = "https://proxy.golang.org";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
const defaultMaxVersionInfoRequests = 40;
export class GoProxyRegistryClient {
    proxyUrl;
    timeoutMs;
    retries;
    maxVersionInfoRequests;
    userAgent;
    fetchImpl;
    cache = new Map();
    constructor(options = {}) {
        this.proxyUrl = (options.proxyUrl ?? defaultProxyUrl).replace(/\/+$/u, "");
        this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
        this.retries = options.retries ?? defaultRetries;
        this.maxVersionInfoRequests =
            options.maxVersionInfoRequests ?? defaultMaxVersionInfoRequests;
        this.userAgent = options.userAgent ?? "sloplock/0.1.0";
        this.fetchImpl = options.fetchImpl ?? fetch;
    }
    async getPackage(reference) {
        if (reference.ecosystem !== "go") {
            return {
                status: "unsupported",
                ecosystem: reference.ecosystem,
                name: reference.name,
                message: "Go proxy registry client only supports Go modules.",
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
        const versionsResult = await this.fetchVersionList(name);
        if (versionsResult.status === "failure") {
            return versionsResult.failure;
        }
        if (versionsResult.status === "success" && versionsResult.versions.length > 0) {
            return this.foundFromVersionList(name, versionsResult.versions);
        }
        const latest = await this.fetchVersionInfo(name, "@latest");
        if (latest.status === "not_found") {
            return { status: "not_found", ecosystem: "go", name };
        }
        if (latest.status === "failure") {
            return latest.failure;
        }
        return foundResult(name, this.moduleProxyUrl(name), latest.firstPublishedAt);
    }
    async foundFromVersionList(name, versions) {
        const candidateVersions = [...versions]
            .sort(compareGoVersions)
            .slice(0, this.maxVersionInfoRequests);
        const firstPublishedDates = [];
        for (const version of candidateVersions) {
            const result = await this.fetchVersionInfo(name, version);
            if (result.status === "success" && result.firstPublishedAt !== undefined) {
                firstPublishedDates.push(result.firstPublishedAt);
            }
        }
        firstPublishedDates.sort((left, right) => left.getTime() - right.getTime());
        return foundResult(name, this.moduleProxyUrl(name), firstPublishedDates[0]);
    }
    async fetchVersionList(name) {
        const result = await this.fetchProxyPath(name, "@v/list");
        if (result.status !== "success") {
            return result;
        }
        const text = await result.response.text();
        return {
            status: "success",
            versions: text
                .split(/\r?\n/u)
                .map((version) => version.trim())
                .filter((version) => isGoVersion(version))
        };
    }
    async fetchVersionInfo(name, version) {
        const result = await this.fetchProxyPath(name, version === "@latest" ? "@latest" : `@v/${escapeGoProxyPath(version)}.info`);
        if (result.status !== "success") {
            return result;
        }
        try {
            const metadata = await result.response.json();
            if (!isGoVersionInfo(metadata)) {
                return {
                    status: "failure",
                    failure: failure(name, "invalid_response", "Go module proxy returned invalid version metadata.", false)
                };
            }
            const firstPublishedAt = dateFromString(metadata.Time);
            return firstPublishedAt === undefined
                ? { status: "success" }
                : { status: "success", firstPublishedAt };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                status: "failure",
                failure: failure(name, "invalid_response", `Go module proxy returned invalid JSON: ${message}`, false)
            };
        }
    }
    async fetchProxyPath(name, proxyPath) {
        let lastFailure;
        for (let attempt = 0; attempt <= this.retries; attempt += 1) {
            const result = await this.fetchProxyPathOnce(name, proxyPath);
            if (result.status === "success" || result.status === "not_found") {
                return result;
            }
            lastFailure = result.failure;
            if (!result.failure.retryable || attempt === this.retries) {
                return result;
            }
            await sleep(100 * (attempt + 1));
        }
        return {
            status: "failure",
            failure: lastFailure ??
                failure(name, "network_error", "Go module proxy request failed without a response.", true)
        };
    }
    async fetchProxyPathOnce(name, proxyPath) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeoutMs);
        try {
            const response = await this.fetchImpl(`${this.moduleProxyUrl(name)}/${proxyPath}`, {
                headers: {
                    accept: "application/json,text/plain;q=0.9",
                    "user-agent": this.userAgent
                },
                signal: controller.signal
            });
            if (response.status === 404 || response.status === 410) {
                return { status: "not_found" };
            }
            if (response.status === 429) {
                return {
                    status: "failure",
                    failure: failure(name, "rate_limited", "Go module proxy rate limit exceeded.", true)
                };
            }
            if (response.status >= 500) {
                return {
                    status: "failure",
                    failure: failure(name, "server_error", `Go module proxy returned HTTP ${response.status}.`, true)
                };
            }
            if (!response.ok) {
                return {
                    status: "failure",
                    failure: failure(name, "network_error", `Go module proxy returned HTTP ${response.status}.`, false)
                };
            }
            return { status: "success", response };
        }
        catch (error) {
            const message = error instanceof Error && error.name === "AbortError"
                ? "Go module proxy request timed out."
                : error instanceof Error
                    ? error.message
                    : String(error);
            return {
                status: "failure",
                failure: failure(name, "network_error", message, true)
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    moduleProxyUrl(name) {
        return `${this.proxyUrl}/${escapeGoProxyPath(name)}`;
    }
}
function foundResult(name, registryUrl, firstPublishedAt) {
    const found = {
        status: "found",
        ecosystem: "go",
        name,
        registryUrl
    };
    return firstPublishedAt === undefined ? found : { ...found, firstPublishedAt };
}
function failure(name, status, message, retryable) {
    return {
        status,
        ecosystem: "go",
        name,
        message,
        retryable
    };
}
function isGoVersionInfo(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const metadata = input;
    return ((metadata.Version === undefined || typeof metadata.Version === "string") &&
        (metadata.Time === undefined || typeof metadata.Time === "string"));
}
function dateFromString(input) {
    if (input === undefined) {
        return undefined;
    }
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function compareGoVersions(left, right) {
    const parsedLeft = parseGoVersion(left);
    const parsedRight = parseGoVersion(right);
    if (parsedLeft === undefined || parsedRight === undefined) {
        return left.localeCompare(right);
    }
    return (parsedLeft.major - parsedRight.major ||
        parsedLeft.minor - parsedRight.minor ||
        parsedLeft.patch - parsedRight.patch ||
        comparePrerelease(parsedLeft.prerelease, parsedRight.prerelease) ||
        left.localeCompare(right));
}
function parseGoVersion(input) {
    const match = /^v(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(input);
    if (match?.groups === undefined) {
        return undefined;
    }
    const major = Number(match.groups.major);
    const minor = Number(match.groups.minor);
    const patch = Number(match.groups.patch);
    if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) {
        return undefined;
    }
    return {
        major,
        minor,
        patch,
        ...(match.groups.prerelease === undefined
            ? {}
            : { prerelease: match.groups.prerelease })
    };
}
function comparePrerelease(left, right) {
    if (left === undefined && right === undefined) {
        return 0;
    }
    if (left === undefined) {
        return 1;
    }
    if (right === undefined) {
        return -1;
    }
    return left.localeCompare(right);
}
function isGoVersion(input) {
    return parseGoVersion(input) !== undefined;
}
function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
//# sourceMappingURL=go.js.map