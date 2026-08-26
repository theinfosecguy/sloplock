import { describe, expect, it } from "vitest";
import { UsageError } from "../src/core/errors.js";
import { helpText, parseCliArgs } from "../src/cli/args.js";

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
      hook: false,
      help: false,
      version: false
    });
  });

  it("parses the hook subcommand", () => {
    expect(parseCliArgs(["hook"]).hook).toBe(true);
    expect(parseCliArgs(["./hook"]).path).toBe("./hook");
    expect(() => parseCliArgs(["hook", "extra"])).toThrow(UsageError);
  });

  it("lists the hook subcommand in help", () => {
    expect(helpText()).toMatch(/^\s+hook\s+run as a Claude Code PreToolUse hook/mu);
  });

  it("parses the check subcommand", () => {
    expect(parseCliArgs(["check", "npm", "express", "left-pad"]).check).toEqual({
      ecosystem: "npm",
      names: ["express", "left-pad"],
      format: "text",
      failClosed: false
    });
    expect(
      parseCliArgs([
        "check",
        "pypi",
        "requests",
        "--format",
        "json",
        "--fail-on",
        "medium",
        "--config",
        "custom.yml",
        "--fail-closed"
      ]).check
    ).toEqual({
      ecosystem: "pypi",
      names: ["requests"],
      format: "json",
      failOn: "medium",
      config: "custom.yml",
      failClosed: true
    });
    expect(() => parseCliArgs(["check", "gradle", "foo"])).toThrow(UsageError);
    expect(() => parseCliArgs(["check", "npm"])).toThrow(UsageError);
    expect(() => parseCliArgs(["check", "npm", "foo", "--format", "markdown"])).toThrow(UsageError);
    expect(helpText()).toMatch(/^\s+check \[options\] <ecosystem> <names\.\.\.>/mu);
  });

  it("rejects unsupported ecosystems", () => {
    expect(() => parseCliArgs(["--ecosystem", "gradle"])).toThrow(UsageError);
  });

  it("accepts Go ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "go"]).ecosystem).toBe("go");
  });

  it("accepts Maven ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "maven"]).ecosystem).toBe("maven");
  });

  it("accepts Packagist ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "packagist"]).ecosystem).toBe(
      "packagist"
    );
  });

  it("accepts RubyGems ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "rubygems"]).ecosystem).toBe("rubygems");
  });

  it("accepts NuGet ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "nuget"]).ecosystem).toBe("nuget");
  });

  it("rejects extra positional arguments", () => {
    expect(() => parseCliArgs(["one", "two"])).toThrow(UsageError);
  });
});
