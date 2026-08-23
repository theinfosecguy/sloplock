import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInit } from "../src/cli/init.js";
import { UsageError } from "../src/core/errors.js";

describe("runInit", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "sloplock-init-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("creates workflow and config in an empty project", async () => {
    const outcome = await runInit(rootDir);

    expect(outcome.created).toEqual([".github/workflows/sloplock.yml", "sloplock.yml"]);
    expect(outcome.skipped).toEqual([]);
    expect(outcome.manifests).toEqual([]);

    const config = await readFile(path.join(rootDir, "sloplock.yml"), "utf8");
    expect(config).toContain("failOn: high");
    expect(config).toContain("- npm");

    const workflow = await readFile(
      path.join(rootDir, ".github", "workflows", "sloplock.yml"),
      "utf8"
    );
    expect(workflow).toContain("uses: theinfosecguy/sloplock@v1");
  });

  it("keeps existing files instead of overwriting them", async () => {
    const workflowPath = path.join(rootDir, ".github", "workflows", "sloplock.yml");
    await mkdir(path.dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, "existing workflow\n", "utf8");
    await writeFile(path.join(rootDir, "sloplock.yml"), "# existing config\n", "utf8");

    const outcome = await runInit(rootDir);

    expect(outcome.created).toEqual([]);
    expect(outcome.skipped).toEqual([".github/workflows/sloplock.yml", "sloplock.yml"]);
    expect(await readFile(workflowPath, "utf8")).toBe("existing workflow\n");
    expect(await readFile(path.join(rootDir, "sloplock.yml"), "utf8")).toBe(
      "# existing config\n"
    );
  });

  it("is idempotent when SlopLock is already initialized", async () => {
    await runInit(rootDir);

    const outcome = await runInit(rootDir);

    expect(outcome.created).toEqual([]);
    expect(outcome.skipped).toEqual([".github/workflows/sloplock.yml", "sloplock.yml"]);
  });

  it("completes when only one of the two files already exists", async () => {
    await writeFile(path.join(rootDir, "sloplock.yml"), "# existing config\n", "utf8");

    const outcome = await runInit(rootDir);

    expect(outcome.created).toEqual([".github/workflows/sloplock.yml"]);
    expect(outcome.skipped).toEqual(["sloplock.yml"]);
  });

  it("detects top-level manifests for the summary hint", async () => {
    await writeFile(path.join(rootDir, "package.json"), "{}\n", "utf8");
    await writeFile(path.join(rootDir, "go.mod"), "module example.com/x\n", "utf8");

    const outcome = await runInit(rootDir);

    expect(outcome.manifests).toEqual(["package.json", "go.mod"]);
  });

  it("reports unreadable target paths as usage errors", async () => {
    await expect(runInit(path.join(rootDir, "missing"))).rejects.toThrow(UsageError);
  });
});
