import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runHook } from "../src/hook/run-hook.js";
import type { RegistryClient, RegistryResult } from "../src/core/types.js";

const now = new Date("2026-06-24T00:00:00.000Z");
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true }))
  );
});

type Decision = {
  hookSpecificOutput: {
    hookEventName: string;
    permissionDecision: string;
    permissionDecisionReason: string;
  };
};

describe("runHook", () => {
  it("ignores tools other than Bash", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Write", tool_input: { file_path: "x", content: "npm install foo" } }),
      cwd: "/tmp",
      registryClient: fakeRegistry({})
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("stays silent for commands that do not install packages", async () => {
    let calls = 0;
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm test && git status" } }),
      cwd: "/tmp",
      registryClient: {
        getPackage(reference) {
          calls += 1;
          return Promise.resolve({ status: "not_found", ecosystem: reference.ecosystem, name: reference.name });
        }
      }
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(calls).toBe(0);
  });

  it("denies installs of packages that do not exist", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm install fastapi-auth-helper" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({})
    });

    expect(outcome.exitCode).toBe(0);
    expect(outcome.stderr).toBe("");
    const decision = parseDecision(outcome.stdout);
    expect(decision.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(decision.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(decision.hookSpecificOutput.permissionDecisionReason).toContain(
      "HIGH npm fastapi-auth-helper: Package does not exist in the npm registry."
    );
    expect(decision.hookSpecificOutput.permissionDecisionReason).toContain("sloplock.yml");
  });

  it("denies packages inside the high cooldown window", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "pip install fresh-package" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "pypi:fresh-package": found("pypi", "fresh-package", "2026-06-22T00:00:00.000Z")
      })
    });

    const decision = parseDecision(outcome.stdout);
    expect(decision.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(decision.hookSpecificOutput.permissionDecisionReason).toContain("first published 2 days ago");
  });

  it("asks for packages inside the medium cooldown window", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "cargo add recent-crate" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "crates:recent-crate": found("crates", "recent-crate", "2026-06-10T00:00:00.000Z")
      })
    });

    const decision = parseDecision(outcome.stdout);
    expect(decision.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(decision.hookSpecificOutput.permissionDecisionReason).toContain("MEDIUM crates recent-crate");
  });

  it("denies medium findings when the project config lowers failOn", async () => {
    const cwd = await tempProject({ "sloplock.yml": "failOn: medium\n" });
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "cargo add recent-crate" }, cwd }),
      cwd: "/elsewhere",
      now,
      registryClient: fakeRegistry({
        "crates:recent-crate": found("crates", "recent-crate", "2026-06-10T00:00:00.000Z")
      })
    });

    expect(parseDecision(outcome.stdout).hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("honors allow entries from sloplock.yml in the event cwd", async () => {
    const cwd = await tempProject({
      "sloplock.yml": `
allow:
  - ecosystem: npm
    package: internal-package
    reason: private registry mirror
    expires: 2030-01-01
`
    });
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm install internal-package" }, cwd }),
      cwd: "/elsewhere",
      now,
      registryClient: fakeRegistry({})
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("stays silent when every package exists and is old enough", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm install express && pip install requests" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "npm:express": found("npm", "express", "2010-01-01T00:00:00.000Z"),
        "pypi:requests": found("pypi", "requests", "2011-01-01T00:00:00.000Z")
      })
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("reports every finding in a mixed command", async () => {
    const outcome = await runHook({
      stdin: event({
        tool_name: "Bash",
        tool_input: { command: "npm install express missing-one && pip install missing-two" }
      }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "npm:express": found("npm", "express", "2010-01-01T00:00:00.000Z")
      })
    });

    const reason = parseDecision(outcome.stdout).hookSpecificOutput.permissionDecisionReason;
    expect(reason).toContain("npm missing-one");
    expect(reason).toContain("pypi missing-two");
    expect(reason).not.toContain("express");
  });

  it("does not block when the registry cannot be reached", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm install flaky-package" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "npm:flaky-package": {
          status: "network_error",
          ecosystem: "npm",
          name: "flaky-package",
          message: "request timed out",
          retryable: true
        }
      })
    });

    expect(outcome.exitCode).toBe(0);
    const output = JSON.parse(outcome.stdout) as { additionalContext?: string; hookSpecificOutput?: unknown };
    expect(output.hookSpecificOutput).toBeUndefined();
    expect(output.additionalContext).toContain("could not verify npm flaky-package");
    expect(output.additionalContext).toContain("request timed out");
  });

  it("skips names that are not valid registry names instead of failing", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: { command: "npm install 'not a name' express" } }),
      cwd: "/tmp",
      now,
      registryClient: fakeRegistry({
        "npm:express": found("npm", "express", "2010-01-01T00:00:00.000Z")
      })
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("reports invalid stdin as a non-blocking error", async () => {
    const outcome = await runHook({ stdin: "not json", cwd: "/tmp", registryClient: fakeRegistry({}) });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.stdout).toBe("");
    expect(outcome.stderr).toContain("sloplock hook:");
  });

  it("tolerates events without a command", async () => {
    const outcome = await runHook({
      stdin: event({ tool_name: "Bash", tool_input: {} }),
      cwd: "/tmp",
      registryClient: fakeRegistry({})
    });

    expect(outcome).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });
});

function event(fields: Record<string, unknown>): string {
  return JSON.stringify({
    session_id: "test",
    hook_event_name: "PreToolUse",
    cwd: "/tmp",
    ...fields
  });
}

function parseDecision(stdout: string): Decision {
  return JSON.parse(stdout) as Decision;
}

async function tempProject(files: Record<string, string>): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-hook-"));
  tempDirs.push(tempDir);
  await Promise.all(
    Object.entries(files).map(([file, content]) => writeFile(path.join(tempDir, file), content))
  );
  return tempDir;
}

function found(
  ecosystem: RegistryResult["ecosystem"],
  name: string,
  firstPublishedAt: string
): RegistryResult {
  return { status: "found", ecosystem, name, firstPublishedAt: new Date(firstPublishedAt) };
}

function fakeRegistry(results: Record<string, RegistryResult>): RegistryClient {
  return {
    getPackage(reference) {
      return Promise.resolve(
        results[`${reference.ecosystem}:${reference.name}`] ?? {
          status: "not_found",
          ecosystem: reference.ecosystem,
          name: reference.name
        }
      );
    }
  };
}
