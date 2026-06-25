#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RegistryFailureError, SlopLockError } from "../core/errors.js";
import { scan } from "../core/scan.js";
import { renderJson } from "../reporting/json.js";
import { renderMarkdown } from "../reporting/markdown.js";
import { hasFailingFindings } from "../reporting/summary.js";
import { renderText } from "../reporting/text.js";
import { helpText, parseCliArgs } from "./args.js";
async function main() {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help) {
        process.stdout.write(helpText());
        return;
    }
    if (args.version) {
        process.stdout.write(`${await packageVersion()}\n`);
        return;
    }
    const result = await scan({
        rootDir: args.path,
        changedOnly: args.changedOnly,
        failClosed: args.failClosed,
        isCi: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
        ...(args.base === undefined ? {} : { baseRef: args.base }),
        ...(args.config === undefined ? {} : { configPath: args.config }),
        ...(args.failOn === undefined ? {} : { failOn: args.failOn })
    });
    const output = renderResult(args.format, result);
    process.stdout.write(output);
    if (!output.endsWith("\n")) {
        process.stdout.write("\n");
    }
    if (args.failClosed && result.registryFailures.length > 0) {
        throw new RegistryFailureError("Registry checks failed and --fail-closed is enabled.");
    }
    if (hasFailingFindings(result, result.failOn)) {
        process.exitCode = 1;
    }
}
function renderResult(format, result) {
    switch (format) {
        case "json":
            return renderJson(result);
        case "markdown":
            return renderMarkdown(result);
        case "text":
            return renderText(result);
    }
}
async function packageVersion() {
    const packageJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
}
try {
    await main();
}
catch (error) {
    if (error instanceof SlopLockError) {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = error.exitCode;
    }
    else if (error instanceof Error) {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 2;
    }
    else {
        process.stderr.write(`${String(error)}\n`);
        process.exitCode = 2;
    }
}
//# sourceMappingURL=index.js.map