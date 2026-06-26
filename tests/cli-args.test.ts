import { describe, expect, it } from "vitest";
import { UsageError } from "../src/core/errors.js";
import { parseCliArgs } from "../src/cli/args.js";

describe("parseCliArgs", () => {
  it("parses supported CLI flags", () => {
    expect(
      parseCliArgs([
        "packages/app",
        "--format",
        "json",
        "--fail-on",
        "medium",
        "--ecosystem",
        "crates",
        "--changed-only",
        "--base",
        "origin/main",
        "--config",
        "sloplock.yml",
        "--fail-closed"
      ])
    ).toEqual({
      path: "packages/app",
      format: "json",
      failOn: "medium",
      ecosystem: "crates",
      changedOnly: true,
      base: "origin/main",
      config: "sloplock.yml",
      failClosed: true,
      help: false,
      version: false
    });
  });

  it("rejects unsupported ecosystems", () => {
    expect(() => parseCliArgs(["--ecosystem", "rubygems"])).toThrow(UsageError);
  });

  it("accepts Go ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "go"]).ecosystem).toBe("go");
  });

  it("accepts Packagist ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "packagist"]).ecosystem).toBe(
      "packagist"
    );
  });

  it("rejects extra positional arguments", () => {
    expect(() => parseCliArgs(["one", "two"])).toThrow(UsageError);
  });
});
