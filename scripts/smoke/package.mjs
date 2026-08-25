import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
);
const expectedVersion =
  typeof packageJson.version === "string" ? packageJson.version : undefined;

if (expectedVersion === undefined) {
  throw new Error("package.json version must be a string.");
}

const tarballName = execFileSync("npm", ["pack", "--silent"], {
  cwd: repoRoot,
  encoding: "utf8"
})
  .trim()
  .split(/\r?\n/u)
  .at(-1);

if (tarballName === undefined || tarballName.length === 0) {
  throw new Error("npm pack did not return a tarball name.");
}

const tarballPath = path.join(repoRoot, tarballName);
const tempDir = mkdtempSync(path.join(tmpdir(), "sloplock-package-smoke-"));

try {
  run("npm", ["init", "-y"], { cwd: tempDir });
  run("npm", ["install", tarballPath], { cwd: tempDir });

  const installedVersion = execFileSync("npx", ["sloplock", "--version"], {
    cwd: tempDir,
    encoding: "utf8"
  }).trim();

  if (installedVersion !== expectedVersion) {
    throw new Error(
      `Expected sloplock ${expectedVersion}, got ${installedVersion}.`
    );
  }

  const scanOutput = execFileSync(
    "npx",
    ["sloplock", "--format", "json"],
    {
      cwd: tempDir,
      encoding: "utf8"
    }
  );
  const report = JSON.parse(scanOutput);

  if (report?.summary?.findings !== 0) {
    throw new Error(`Expected 0 findings, got ${scanOutput}`);
  }

  const quietHook = hook("npm test");
  if (quietHook !== "") {
    throw new Error(`Expected no hook output for a non-install command, got ${quietHook}`);
  }

  const denied = JSON.parse(
    hook("npm install sloplock-smoke-nonexistent-package-4f9a1c")
  );
  if (denied?.hookSpecificOutput?.permissionDecision !== "deny") {
    throw new Error(`Expected the hook to deny a nonexistent package, got ${JSON.stringify(denied)}`);
  }
} finally {
  unlinkSync(tarballPath);
  rmSync(tempDir, { recursive: true, force: true });
}

function hook(command) {
  return execFileSync("npx", ["sloplock", "hook"], {
    cwd: tempDir,
    encoding: "utf8",
    input: JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command },
      cwd: tempDir
    })
  });
}

function run(command, args, options) {
  execFileSync(command, args, {
    stdio: "ignore",
    ...options
  });
}
