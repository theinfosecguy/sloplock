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
        "pypi",
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
      ecosystem: "pypi",
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

  it("rejects extra positional arguments", () => {
    expect(() => parseCliArgs(["one", "two"])).toThrow(UsageError);
  });
});
