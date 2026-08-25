import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  sloplockRepositoryUserAgent,
  sloplockUserAgent,
  sloplockVersion
} from "../src/core/version.js";

describe("user agent metadata", () => {
  it("tracks the package version", () => {
    const packageJson = JSON.parse(
      readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
        "utf8"
      )
    ) as { version?: unknown };

    if (typeof packageJson.version !== "string") {
      throw new Error("package.json version must be a string.");
    }

    expect(sloplockVersion).toBe(packageJson.version);
    expect(sloplockUserAgent).toBe(`sloplock/${packageJson.version}`);
    expect(sloplockRepositoryUserAgent).toBe(
      `sloplock/${packageJson.version} (https://github.com/theinfosecguy/sloplock)`
    );
  });

  it("keeps the Claude Code plugin manifest on the package version", () => {
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    const read = (file: string): { version?: unknown } =>
      JSON.parse(readFileSync(path.join(root, file), "utf8")) as { version?: unknown };

    expect(read(".claude-plugin/plugin.json").version).toBe(read("package.json").version);
  });
});
