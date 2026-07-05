import { beforeEach, describe, expect, it, vi } from "vitest";

const inputValues = vi.hoisted(() => new Map<string, string>());

vi.mock("@actions/core", () => ({
  getBooleanInput: vi.fn((name: string) => {
    const value = inputValues.get(name);
    if (value === "throw") {
      throw new Error(`invalid boolean input ${name}`);
    }

    return value === "true";
  }),
  getInput: vi.fn((name: string) => {
    const value = inputValues.get(name);
    if (value === "throw") {
      throw new Error(`invalid input ${name}`);
    }

    return value ?? "";
  })
}));

import {
  readActionFailureInputs,
  readActionInputs
} from "../src/action/inputs.js";

describe("readActionInputs", () => {
  beforeEach(() => {
    inputValues.clear();
  });

  it("accepts Maven ecosystem scans", () => {
    inputValues.set("ecosystem", "maven");

    expect(readActionInputs()).toMatchObject({
      path: ".",
      failOn: "high",
      ecosystems: ["maven"],
      changedOnly: false,
      comment: false,
      failClosed: false
    });
  });

  it("accepts Packagist ecosystem scans", () => {
    inputValues.set("ecosystem", "packagist");

    expect(readActionInputs()).toMatchObject({
      path: ".",
      failOn: "high",
      ecosystems: ["packagist"],
      changedOnly: false,
      comment: false,
      failClosed: false
    });
  });

  it("accepts RubyGems ecosystem scans", () => {
    inputValues.set("ecosystem", "rubygems");

    expect(readActionInputs()).toMatchObject({
      path: ".",
      failOn: "high",
      ecosystems: ["rubygems"],
      changedOnly: false,
      comment: false,
      failClosed: false
    });
  });

  it("accepts NuGet ecosystem scans", () => {
    inputValues.set("ecosystem", "nuget");

    expect(readActionInputs()).toMatchObject({
      path: ".",
      failOn: "high",
      ecosystems: ["nuget"],
      changedOnly: false,
      comment: false,
      failClosed: false
    });
  });

  it("keeps all ecosystems enabled by default", () => {
    expect(readActionInputs().ecosystems).toBeUndefined();
  });

  it("builds fallback inputs when strict input parsing fails", () => {
    inputValues.set("path", "packages/api");
    inputValues.set("base", "origin/main");
    inputValues.set("config", "sloplock.yml");
    inputValues.set("github-token", "token");
    inputValues.set("changed-only", "throw");
    inputValues.set("comment", "false");
    inputValues.set("fail-closed", "throw");

    expect(readActionFailureInputs()).toEqual({
      path: "packages/api",
      failOn: "high",
      changedOnly: true,
      base: "origin/main",
      config: "sloplock.yml",
      comment: false,
      githubToken: "token",
      failClosed: false
    });
  });

  it("uses safe defaults when fallback input reads fail", () => {
    inputValues.set("path", "throw");
    inputValues.set("comment", "throw");

    expect(readActionFailureInputs()).toMatchObject({
      path: ".",
      failOn: "high",
      changedOnly: false,
      comment: true,
      failClosed: false
    });
  });
});
