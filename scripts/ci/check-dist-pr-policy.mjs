import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import process from "node:process";

const usage = `Usage: node scripts/ci/check-dist-pr-policy.mjs --base <git-ref>

Feature PRs should leave dist/ out. Commit dist/ only in a dedicated generated-artifact refresh PR after source changes land on main.`;

const baseRef = parseBaseRef(process.argv.slice(2));

if (baseRef === undefined) {
  process.stderr.write(`${usage}\n`);
  process.exit(2);
}

const changedFiles = git([
  "diff",
  "--name-only",
  "--diff-filter=ACDMRT",
  `${baseRef}...HEAD`
])
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean);

const distChanges = changedFiles.filter(isDistFile);
const nonDistChanges = changedFiles.filter((file) => !isDistFile(file));

writeGithubOutput("dist_changed", distChanges.length > 0 ? "true" : "false");

if (distChanges.length > 0 && nonDistChanges.length > 0) {
  process.stderr.write(
    [
      "Do not mix generated dist/ changes with source, docs, tests, or workflow changes.",
      "",
      "Leave dist/ out of feature PRs. After source PRs land on main, open a dedicated generated-artifact refresh PR that only contains dist/ changes from npm run build.",
      "",
      "dist/ changes:",
      ...distChanges.map((file) => `  - ${file}`),
      "",
      "non-dist changes:",
      ...nonDistChanges.map((file) => `  - ${file}`)
    ].join("\n")
  );
  process.stderr.write("\n");
  process.exit(1);
}

if (distChanges.length > 0) {
  process.stdout.write(
    `Generated-artifact refresh PR detected: ${distChanges.length} dist/ file(s) changed and no non-dist files changed.\n`
  );
} else {
  process.stdout.write(
    "Generated-artifact policy passed: this PR does not change dist/.\n"
  );
}

function parseBaseRef(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--base") {
      const value = args[index + 1];
      return typeof value === "string" && value.length > 0 ? value : undefined;
    }

    if (typeof arg === "string" && arg.startsWith("--base=")) {
      const value = arg.slice("--base=".length);
      return value.length > 0 ? value : undefined;
    }
  }

  return undefined;
}

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    process.stderr.write(`Unable to inspect git changes from ${baseRef}.\n`);
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exit(2);
  }
}

function isDistFile(file) {
  return file === "dist" || file.startsWith("dist/");
}

function writeGithubOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (typeof outputPath !== "string" || outputPath.length === 0) {
    return;
  }

  appendFileSync(outputPath, `${name}=${value}\n`);
}
