import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { UsageError } from "../core/errors.js";
import { normalizePackageName } from "../core/packages.js";
const defaultConfig = {
    failOn: "high",
    ecosystems: ["crates", "go", "npm", "nuget", "packagist", "pypi", "rubygems"],
    cooldown: {
        highDays: 7,
        mediumDays: 30
    },
    go: {
        privateModules: []
    },
    allow: [],
    ignore: []
};
export async function loadConfig(options) {
    const warnings = [];
    const configFile = options.configPath ?? "sloplock.yml";
    const configFilePath = path.isAbsolute(configFile)
        ? configFile
        : path.join(options.rootDir, configFile);
    const exists = await fileExists(configFilePath);
    const configInput = exists
        ? parseConfigFile(await readFile(configFilePath, "utf8"), configFile)
        : {};
    if (!exists && options.configPath !== undefined) {
        throw new UsageError(`Config file not found: ${options.configPath}`);
    }
    const config = mergeConfig(configInput, options.failOn);
    const filteredAllow = filterExpiredAllowRules(config.allow, warnings, configFile, options.now);
    const filteredIgnore = filterExpiredIgnoreRules(config.ignore, warnings, configFile, options.now);
    if (options.isCi === true) {
        for (const rule of [...filteredAllow, ...filteredIgnore]) {
            if (rule.expires === undefined) {
                warnings.push({
                    file: configFile,
                    message: `Allow or ignore entry for ${rule.package} should include an expires date in CI.`
                });
            }
        }
    }
    return {
        config: {
            ...config,
            allow: filteredAllow,
            ignore: filteredIgnore
        },
        warnings
    };
}
function parseConfigFile(content, sourceFile) {
    try {
        return parseYaml(content) ?? {};
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new UsageError(`Invalid YAML in ${sourceFile}: ${message}`);
    }
}
function mergeConfig(input, failOnOverride) {
    if (!isRecord(input)) {
        throw new UsageError("Config file must contain a mapping.");
    }
    const failOn = parseFailOn(input.failOn, failOnOverride);
    const cooldown = parseCooldown(input.cooldown);
    const ecosystems = parseEcosystems(input.ecosystems);
    const go = parseGoConfig(input.go);
    return {
        failOn,
        ecosystems,
        cooldown,
        go,
        allow: parseAllowRules(input.allow),
        ignore: parseIgnoreRules(input.ignore)
    };
}
function parseFailOn(input, override) {
    if (override !== undefined) {
        return override;
    }
    if (input === undefined) {
        return defaultConfig.failOn;
    }
    if (input === "medium" || input === "high") {
        return input;
    }
    throw new UsageError("Config failOn must be either medium or high.");
}
function parseCooldown(input) {
    if (input === undefined) {
        return defaultConfig.cooldown;
    }
    if (!isRecord(input)) {
        throw new UsageError("Config cooldown must contain highDays and mediumDays.");
    }
    const highDays = parsePositiveInteger(input.highDays, "cooldown.highDays");
    const mediumDays = parsePositiveInteger(input.mediumDays, "cooldown.mediumDays");
    if (highDays > mediumDays) {
        throw new UsageError("Config cooldown.highDays must be <= cooldown.mediumDays.");
    }
    return { highDays, mediumDays };
}
function parseEcosystems(input) {
    if (input === undefined) {
        return [...defaultConfig.ecosystems];
    }
    if (!Array.isArray(input) || input.length === 0) {
        throw new UsageError("Config ecosystems must be a non-empty array.");
    }
    const ecosystems = new Set();
    for (const ecosystem of input) {
        ecosystems.add(parseEcosystem(ecosystem, "ecosystems[]"));
    }
    return [...ecosystems].sort();
}
function parseAllowRules(input) {
    if (input === undefined) {
        return [];
    }
    if (!Array.isArray(input)) {
        throw new UsageError("Config allow must be an array.");
    }
    return input.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new UsageError(`Config allow[${index}] must be a mapping.`);
        }
        const ecosystem = parseEcosystem(entry.ecosystem, `allow[${index}].ecosystem`);
        const packageName = parsePackage(entry.package, ecosystem, `allow[${index}].package`);
        const reason = parseReason(entry.reason, `allow[${index}].reason`);
        const expires = parseOptionalDate(entry.expires, `allow[${index}].expires`);
        return expires === undefined
            ? { ecosystem, package: packageName, reason }
            : { ecosystem, package: packageName, reason, expires };
    });
}
function parseIgnoreRules(input) {
    if (input === undefined) {
        return [];
    }
    if (!Array.isArray(input)) {
        throw new UsageError("Config ignore must be an array.");
    }
    return input.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new UsageError(`Config ignore[${index}] must be a mapping.`);
        }
        const rule = parseRule(entry.rule, `ignore[${index}].rule`);
        const ecosystem = parseEcosystem(entry.ecosystem, `ignore[${index}].ecosystem`);
        const packageName = parsePackage(entry.package, ecosystem, `ignore[${index}].package`);
        const reason = parseReason(entry.reason, `ignore[${index}].reason`);
        const expires = parseOptionalDate(entry.expires, `ignore[${index}].expires`);
        return expires === undefined
            ? { rule, ecosystem, package: packageName, reason }
            : { rule, ecosystem, package: packageName, reason, expires };
    });
}
function filterExpiredAllowRules(rules, warnings, sourceFile, now) {
    return rules.filter((rule) => {
        if (rule.expires === undefined || rule.expires.getTime() >= startOfDay(now)) {
            return true;
        }
        warnings.push({
            file: sourceFile,
            message: `Expired allow entry ignored for ${rule.package}.`
        });
        return false;
    });
}
function filterExpiredIgnoreRules(rules, warnings, sourceFile, now) {
    return rules.filter((rule) => {
        if (rule.expires === undefined || rule.expires.getTime() >= startOfDay(now)) {
            return true;
        }
        warnings.push({
            file: sourceFile,
            message: `Expired ignore entry ignored for ${rule.package}.`
        });
        return false;
    });
}
function parseEcosystem(input, field) {
    if (input === "crates" ||
        input === "go" ||
        input === "npm" ||
        input === "nuget" ||
        input === "packagist" ||
        input === "pypi" ||
        input === "rubygems") {
        return input;
    }
    throw new UsageError(`Config ${field} must be crates, go, npm, nuget, packagist, pypi, or rubygems.`);
}
function parseRule(input, field) {
    if (input === "package_not_found" || input === "package_too_new") {
        return input;
    }
    throw new UsageError(`Config ${field} must be package_not_found or package_too_new.`);
}
function parsePackage(input, ecosystem, field) {
    if (typeof input !== "string") {
        throw new UsageError(`Config ${field} must be a package name.`);
    }
    const packageName = normalizePackageName(ecosystem, input);
    if (packageName === undefined) {
        throw new UsageError(`Config ${field} is not a valid ${ecosystem} package name.`);
    }
    return packageName;
}
function parseReason(input, field) {
    if (typeof input !== "string" || input.trim().length === 0) {
        throw new UsageError(`Config ${field} must be a non-empty reason.`);
    }
    return input.trim();
}
function parseOptionalDate(input, field) {
    if (input === undefined) {
        return undefined;
    }
    if (typeof input !== "string") {
        throw new UsageError(`Config ${field} must be an ISO date string.`);
    }
    const date = new Date(`${input}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(input) || Number.isNaN(date.getTime())) {
        throw new UsageError(`Config ${field} must use YYYY-MM-DD.`);
    }
    return date;
}
function parsePositiveInteger(input, field) {
    if (!Number.isInteger(input) || typeof input !== "number" || input < 0) {
        throw new UsageError(`Config ${field} must be a non-negative integer.`);
    }
    return input;
}
function parseGoConfig(input) {
    if (input === undefined) {
        return defaultConfig.go;
    }
    if (!isRecord(input)) {
        throw new UsageError("Config go must contain privateModules.");
    }
    return {
        privateModules: parseStringArray(input.privateModules, "go.privateModules", defaultConfig.go.privateModules)
    };
}
function parseStringArray(input, field, defaultValue) {
    if (input === undefined) {
        return [...defaultValue];
    }
    if (!Array.isArray(input)) {
        throw new UsageError(`Config ${field} must be an array.`);
    }
    return input.map((entry, index) => {
        if (typeof entry !== "string" || entry.trim().length === 0) {
            throw new UsageError(`Config ${field}[${index}] must be a non-empty string.`);
        }
        return entry.trim();
    });
}
function isRecord(input) {
    return typeof input === "object" && input !== null && !Array.isArray(input);
}
async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function startOfDay(date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
//# sourceMappingURL=load-config.js.map