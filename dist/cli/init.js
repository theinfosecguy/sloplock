import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { UsageError } from "../core/errors.js";
const workflowRelativePath = path.join(".github", "workflows", "sloplock.yml");
const workflowContent = `name: SlopLock

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  sloplock:
    name: SlopLock dependency gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: theinfosecguy/sloplock@v1
`;
const configContent = `# SlopLock scans dependency manifests and lockfiles in this repository.
# Docs: https://github.com/theinfosecguy/sloplock#configuration
failOn: high

ecosystems:
  - npm
  - pypi
  - go
  - crates
  - maven
  - nuget
  - packagist
  - rubygems
`;
const manifestFileNames = [
    "package.json",
    "pyproject.toml",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "composer.json",
    "Gemfile"
];
export async function runInit(rootDir) {
    const targetDir = await resolveTargetDir(rootDir);
    const workflowPath = path.join(targetDir, workflowRelativePath);
    const configPath = path.join(targetDir, "sloplock.yml");
    const workflowExists = await fileExists(workflowPath);
    const configExists = await fileExists(configPath);
    const skipped = [];
    const created = [];
    if (!workflowExists) {
        await mkdir(path.dirname(workflowPath), { recursive: true });
        await writeFile(workflowPath, workflowContent, "utf8");
        created.push(workflowRelativePath);
    }
    else {
        skipped.push(workflowRelativePath);
    }
    if (!configExists) {
        await writeFile(configPath, configContent, "utf8");
        created.push("sloplock.yml");
    }
    else {
        skipped.push("sloplock.yml");
    }
    return {
        created,
        skipped,
        manifests: await detectTopLevelManifests(targetDir)
    };
}
export function renderInitOutcome(outcome) {
    const lines = [];
    for (const file of outcome.created) {
        lines.push(`Created ${file}`);
    }
    for (const file of outcome.skipped) {
        lines.push(`Kept existing ${file}`);
    }
    if (outcome.manifests.length > 0) {
        lines.push(`Detected ${outcome.manifests.join(", ")}`);
    }
    lines.push("");
    lines.push("Next steps:");
    lines.push("1. Commit the new files.");
    lines.push("2. Narrow the ecosystems list in sloplock.yml to what this repository uses.");
    lines.push("3. Open a pull request that changes dependencies to see SlopLock review it.");
    return `${lines.join("\n")}\n`;
}
async function resolveTargetDir(rootDir) {
    const resolved = path.resolve(rootDir);
    try {
        if ((await stat(resolved)).isDirectory()) {
            return resolved;
        }
    }
    catch {
        // Reported below alongside the non-directory case.
    }
    throw new UsageError(`Target path '${rootDir}' does not exist or is not a readable directory.`);
}
async function fileExists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function detectTopLevelManifests(targetDir) {
    const entries = new Set(await readdir(targetDir));
    return manifestFileNames.filter((fileName) => entries.has(fileName));
}
//# sourceMappingURL=init.js.map