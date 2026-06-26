import { beforeEach, describe, expect, it, vi } from "vitest";

const inputValues = vi.hoisted(() => new Map<string, string>());

vi.mock("@actions/core", () => ({
  getBooleanInput: vi.fn((name: string) => inputValues.get(name) === "true"),
  getInput: vi.fn((name: string) => inputValues.get(name) ?? "")
}));

import { readActionInputs } from "../src/action/inputs.js";

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
});
