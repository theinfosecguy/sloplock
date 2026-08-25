#!/usr/bin/env node
import { RegistryFailureError, SlopLockError } from "../core/errors.js";
import { scan } from "../core/scan.js";
import { sloplockVersion } from "../core/version.js";
import { renderJson, renderJsonError } from "../reporting/json.js";
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
        process.stdout.write(`${sloplockVersion}\n`);
        return;
    }
    let result;
    try {
        result = await scan({
            rootDir: args.path,
            changedOnly: args.changedOnly,
            ...(args.base === undefined ? {} : { baseRef: args.base }),
            ...(args.config === undefined ? {} : { configPath: args.config }),
            ...(args.ecosystem === undefined ? {} : { ecosystems: [args.ecosystem] }),
            ...(args.failOn === undefined ? {} : { failOn: args.failOn })
        });
    }
    catch (error) {
        // Rendered here rather than by the top-level handler so that a JSON error
        // document is only ever written in place of a report, never after one.
        writeError(args.format, error);
        return;
    }
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
function writeError(format, error) {
    const message = error instanceof Error ? error.message : String(error);
    const hint = error instanceof SlopLockError ? error.hint : undefined;
    if (format === "json") {
        process.stdout.write(renderJsonError({
            code: error instanceof SlopLockError ? error.code : "internal_error",
            message,
            ...(hint === undefined ? {} : { hint })
        }));
    }
    else {
        process.stderr.write(`${hint === undefined ? message : `${message} ${hint}`}\n`);
    }
    process.exitCode = error instanceof SlopLockError ? error.exitCode : 2;
}
try {
    await main();
}
catch (error) {
    writeError("text", error);
}
//# sourceMappingURL=index.js.map