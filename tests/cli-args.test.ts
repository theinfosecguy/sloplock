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
      command: "scan",
      path: "packages/app",
      format: "json",
      failOn: "medium",
      ecosystem: "crates",
      changedOnly: true,
      base: "origin/main",
      config: "sloplock.yml",
      failClosed: true
    });
  });

  it("rejects unsupported ecosystems", () => {
    expect(() => parseCliArgs(["--ecosystem", "gradle"])).toThrow(UsageError);
  });

  it("accepts Go ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "go"])).toMatchObject({
      command: "scan",
      ecosystem: "go"
    });
  });

  it("accepts Maven ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "maven"])).toMatchObject({
      command: "scan",
      ecosystem: "maven"
    });
  });

  it("accepts Packagist ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "packagist"])).toMatchObject({
      command: "scan",
      ecosystem: "packagist"
    });
  });

  it("accepts RubyGems ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "rubygems"])).toMatchObject({
      command: "scan",
      ecosystem: "rubygems"
    });
  });

  it("accepts NuGet ecosystem scans", () => {
    expect(parseCliArgs(["--ecosystem", "nuget"])).toMatchObject({
      command: "scan",
      ecosystem: "nuget"
    });
  });

  it("rejects extra positional arguments", () => {
    expect(() => parseCliArgs(["one", "two"])).toThrow(UsageError);
  });
});

describe("parseCliArgs init command", () => {
  it("defaults the target directory to the working directory", () => {
    expect(parseCliArgs(["init"])).toEqual({ command: "init", path: "." });
  });

  it("accepts an explicit target directory", () => {
    expect(parseCliArgs(["init", "packages/app"])).toEqual({
      command: "init",
      path: "packages/app"
    });
  });

  it("rejects options after init", () => {
    expect(() => parseCliArgs(["init", "--format", "json"])).toThrow(UsageError);
  });

  it("rejects extra arguments after init", () => {
    expect(() => parseCliArgs(["init", "a", "b"])).toThrow(UsageError);
  });
});
