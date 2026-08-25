import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverDependencyFiles, isIgnoredPath } from "../src/discovery/find-files.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true }))
  );
});

describe("discoverDependencyFiles", () => {
  it("skips virtualenv and vendored directories", async () => {
    const rootDir = await tempProject({
      "package.json": "{}",
      ".venv/lib/python3.12/site-packages/somepkg/pyproject.toml": "",
      ".venv/lib/python3.12/site-packages/somepkg/requirements.txt": "",
      "vendor/bundle/gems/x/Gemfile": ""
    });

    expect(await discoverDependencyFiles(rootDir)).toEqual(["package.json"]);
  });
});

describe("isIgnoredPath", () => {
  it("matches ignored directories at any depth", () => {
    expect(isIgnoredPath("packages/api/vendor/x/composer.json")).toBe(true);
    expect(isIgnoredPath("packages/api/composer.json")).toBe(false);
  });
});

async function tempProject(files: Record<string, string>): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-"));
  tempDirs.push(tempDir);

  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      await mkdir(path.dirname(path.join(tempDir, file)), { recursive: true });
      await writeFile(path.join(tempDir, file), content);
    })
  );

  return tempDir;
}
