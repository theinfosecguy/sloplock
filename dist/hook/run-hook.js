import { checkPackages } from "../core/scan.js";
import { isAtOrAboveSeverity } from "../core/severity.js";
import { extractInstallPackages } from "./install-commands.js";
const silent = { exitCode: 0, stdout: "", stderr: "" };
export async function runHook(input) {
    let event;
    try {
        event = JSON.parse(input.stdin);
    }
    catch {
        return failure("expected a Claude Code hook event as JSON on stdin.");
    }
    const command = bashCommand(event);
    if (command === undefined) {
        return silent;
    }
    const packages = extractInstallPackages(command, input.env);
    if (packages.length === 0) {
        return silent;
    }
    let result;
    try {
        result = await checkPackages({
            packages,
            rootDir: eventCwd(event) ?? input.cwd,
            ...(input.registryClient === undefined ? {} : { registryClient: input.registryClient }),
            ...(input.now === undefined ? {} : { now: input.now })
        });
    }
    catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
    }
    const blocking = result.findings.some((finding) => isAtOrAboveSeverity(finding.severity, result.failOn));
    if (blocking) {
        return decision("deny", `SlopLock blocked this install.\n\n${describe(result.findings)}\n\nUse a package that exists and has aged past the cooldown window. If this is a verified private package, add an allow entry with an expiry to sloplock.yml.`);
    }
    if (result.findings.length > 0) {
        return decision("ask", `SlopLock flagged this install.\n\n${describe(result.findings)}`);
    }
    if (result.registryFailures.length > 0) {
        const names = result.registryFailures.map((entry) => `${entry.ecosystem} ${entry.name}`);
        return {
            exitCode: 0,
            stdout: `${JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "PreToolUse",
                    additionalContext: `SlopLock could not verify ${names.join(", ")} against the public registry: ${result.registryFailures[0]?.message ?? "registry check failed"}`
                }
            })}\n`,
            stderr: ""
        };
    }
    return silent;
}
function bashCommand(event) {
    if (typeof event !== "object" || event === null) {
        return undefined;
    }
    const { tool_name: toolName, tool_input: toolInput } = event;
    if (toolName !== "Bash" || typeof toolInput !== "object" || toolInput === null) {
        return undefined;
    }
    const { command } = toolInput;
    return typeof command === "string" ? command : undefined;
}
function eventCwd(event) {
    const { cwd } = event;
    return typeof cwd === "string" && cwd.length > 0 ? cwd : undefined;
}
function describe(findings) {
    return findings
        .map((finding) => `${finding.severity.toUpperCase()} ${finding.ecosystem} ${finding.package}: ${finding.evidence} ${finding.recommendation}`)
        .join("\n");
}
function decision(permissionDecision, reason) {
    return {
        exitCode: 0,
        stdout: `${JSON.stringify({
            hookSpecificOutput: {
                hookEventName: "PreToolUse",
                permissionDecision,
                permissionDecisionReason: reason
            }
        })}\n`,
        stderr: ""
    };
}
function failure(message) {
    return { exitCode: 1, stdout: "", stderr: `sloplock hook: ${message}\n` };
}
//# sourceMappingURL=run-hook.js.map