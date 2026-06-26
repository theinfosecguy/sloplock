const nugetServiceIndexUrl = "https://api.nuget.org/v3/index.json";
const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
export class NugetRegistryClient {
    timeoutMs;
    retries;
    userAgent;
    fetchImpl;
    cache = new Map();
    serviceIndex;
    constructor(options = {}) {
        this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
        this.retries = options.retries ?? defaultRetries;
        this.userAgent = options.userAgent ?? "sloplock/0.1.0";
        this.fetchImpl = options.fetchImpl ?? fetch;
    }
    async getPackage(reference) {
        if (reference.ecosystem !== "nuget") {
            return {
                status: "unsupported",
                ecosystem: reference.ecosystem,
                name: reference.name,
                message: "NuGet.org registry client only supports NuGet packages.",
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
            ecosystem: "nuget",
            name,
            message: "NuGet.org registry request failed without a response.",
            retryable: true
        });
    }
    async fetchPackage(name) {
        const registrationBase = await this.registrationBaseUrl(name);
        if (typeof registrationBase !== "string") {
            return registrationBase;
        }
        const indexUrl = `${registrationBase}${encodeURIComponent(name.toLowerCase())}/index.json`;
        const indexResult = await this.fetchJson(name, indexUrl);
        if (indexResult.status === "not_found") {
            return { status: "not_found", ecosystem: "nuget", name };
        }
        if (indexResult.status !== "ok") {
            return indexResult.failure;
        }
        return this.parseRegistrationIndex(name, indexUrl, indexResult.body);
    }
    async registrationBaseUrl(name) {
        this.serviceIndex ??= this.fetchServiceIndex(name);
        try {
            return await this.serviceIndex;
        }
        catch (error) {
            return failure(name, "network_error", error instanceof Error ? error.message : String(error), true);
        }
    }
    async fetchServiceIndex(name) {
        const result = await this.fetchJson(name, nugetServiceIndexUrl);
        if (result.status !== "ok") {
            throw new Error(result.status === "not_found" ? "NuGet.org service index was not found." : result.failure.message);
        }
        if (!isServiceIndex(result.body)) {
            throw new Error("NuGet.org service index returned invalid metadata.");
        }
        const resource = result.body.resources.find((candidate) => isRegistrationBaseType(candidate["@type"]));
        const resourceUrl = resource?.["@id"];
        if (resourceUrl === undefined) {
            throw new Error("NuGet.org service index did not include a registration base URL.");
        }
        return resourceUrl.endsWith("/") ? resourceUrl : `${resourceUrl}/`;
    }
    async parseRegistrationIndex(name, indexUrl, body) {
        if (!isRegistrationIndex(body)) {
            return failure(name, "invalid_response", "NuGet.org registry returned invalid package metadata.", false);
        }
        const pageResults = await Promise.all((body.items ?? []).map(async (page) => {
            if (Array.isArray(page.items)) {
                return { status: "ok", leaves: page.items };
            }
            if (page["@id"] === undefined) {
                return {
                    status: "failure",
                    failure: failure(name, "invalid_response", "NuGet.org registry returned a registration page without items.", false)
                };
            }
            const pageResult = await this.fetchJson(name, page["@id"]);
            if (pageResult.status !== "ok") {
                return {
                    status: "failure",
                    failure: pageResult.status === "not_found"
                        ? failure(name, "invalid_response", "NuGet.org registry registration page was not found.", false)
                        : pageResult.failure
                };
            }
            return isRegistrationPage(pageResult.body)
                ? { status: "ok", leaves: pageResult.body.items ?? [] }
                : {
                    status: "failure",
                    failure: failure(name, "invalid_response", "NuGet.org registry returned invalid registration page metadata.", false)
                };
        }));
        const failedPage = pageResults.find((page) => page.status === "failure");
        if (failedPage?.status === "failure") {
            return failedPage.failure;
        }
        const firstPublishedAt = firstPublishedDate(pageResults.flatMap((page) => (page.status === "ok" ? page.leaves : [])));
        const found = {
            status: "found",
            ecosystem: "nuget",
            name,
            registryUrl: indexUrl
        };
        return firstPublishedAt === undefined
            ? found
            : { ...found, firstPublishedAt };
    }
    async fetchJson(name, url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeoutMs);
        try {
            const response = await this.fetchImpl(url, {
                headers: {
                    accept: "application/json",
                    "user-agent": this.userAgent
                },
                signal: controller.signal
            });
            if (response.status === 404) {
                return { status: "not_found" };
            }
            if (response.status === 429) {
                return {
                    status: "failure",
                    failure: failure(name, "rate_limited", "NuGet.org registry rate limit exceeded.", true)
                };
            }
            if (response.status >= 500) {
                return {
                    status: "failure",
                    failure: failure(name, "server_error", `NuGet.org registry returned HTTP ${response.status}.`, true)
                };
            }
            if (!response.ok) {
                return {
                    status: "failure",
                    failure: failure(name, "network_error", `NuGet.org registry returned HTTP ${response.status}.`, false)
                };
            }
            return { status: "ok", body: await response.json() };
        }
        catch (error) {
            const message = error instanceof Error && error.name === "AbortError"
                ? "NuGet.org registry request timed out."
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
}
function firstPublishedDate(leaves) {
    const publishedDates = leaves
        .map((leaf) => dateFromString(leaf.catalogEntry?.published ?? leaf.published))
        .filter((date) => date !== undefined)
        .filter((date) => date.getUTCFullYear() > 1900)
        .sort((left, right) => left.getTime() - right.getTime());
    return publishedDates[0];
}
function dateFromString(input) {
    if (input === undefined) {
        return undefined;
    }
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function isServiceIndex(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const resources = input.resources;
    return Array.isArray(resources) && resources.every(isServiceIndexResource);
}
function isServiceIndexResource(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const resource = input;
    return ((resource["@id"] === undefined || typeof resource["@id"] === "string") &&
        (resource["@type"] === undefined || typeof resource["@type"] === "string"));
}
function isRegistrationIndex(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const items = input.items;
    return items === undefined || (Array.isArray(items) && items.every(isRegistrationPage));
}
function isRegistrationPage(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const page = input;
    return ((page["@id"] === undefined || typeof page["@id"] === "string") &&
        (page.items === undefined ||
            (Array.isArray(page.items) && page.items.every(isRegistrationLeaf))));
}
function isRegistrationLeaf(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return false;
    }
    const leaf = input;
    if (leaf.published !== undefined && typeof leaf.published !== "string") {
        return false;
    }
    if (leaf.catalogEntry === undefined) {
        return true;
    }
    if (typeof leaf.catalogEntry !== "object" ||
        leaf.catalogEntry === null ||
        Array.isArray(leaf.catalogEntry)) {
        return false;
    }
    const catalogEntry = leaf.catalogEntry;
    return (catalogEntry.published === undefined ||
        typeof catalogEntry.published === "string");
}
function isRegistrationBaseType(input) {
    if (input === undefined) {
        return false;
    }
    return input
        .split(/\s+/u)
        .some((entry) => entry.toLowerCase().startsWith("registrationsbaseurl/"));
}
function failure(name, status, message, retryable) {
    return {
        status,
        ecosystem: "nuget",
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
//# sourceMappingURL=nuget.js.map