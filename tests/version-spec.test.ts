import { describe, expect, it } from "vitest";
import { stripVersionSpec } from "../src/core/packages.js";
import type { Ecosystem } from "../src/core/types.js";

const cases: [Ecosystem, string, string][] = [
  ["npm", "express", "express"],
  ["npm", "express@4", "express"],
  ["npm", "express@^4.19.0", "express"],
  ["npm", "@types/node@22", "@types/node"],
  ["npm", "@types/node", "@types/node"],
  ["pypi", "requests", "requests"],
  ["pypi", "requests==2.32.0", "requests"],
  ["pypi", "requests>=2,<3", "requests"],
  ["pypi", "requests~=2.32", "requests"],
  ["pypi", "requests[socks]", "requests"],
  ["pypi", "requests!=2.0", "requests"],
  ["crates", "serde@1", "serde"],
  ["crates", "serde", "serde"],
  ["go", "github.com/spf13/cobra@v1.8.0", "github.com/spf13/cobra"],
  ["go", "github.com/spf13/cobra@latest", "github.com/spf13/cobra"],
  ["rubygems", "rake:13.0", "rake"],
  ["rubygems", "rake", "rake"],
  ["packagist", "vendor/pkg:^1.0", "vendor/pkg"],
  ["packagist", "vendor/pkg=1.2", "vendor/pkg"],
  ["nuget", "Newtonsoft.Json@13.0.3", "Newtonsoft.Json"],
  ["nuget", "Newtonsoft.Json", "Newtonsoft.Json"],
  ["maven", "com.acme:lib:1.0.0", "com.acme:lib"],
  ["maven", "com.acme:lib", "com.acme:lib"]
];

describe("stripVersionSpec", () => {
  it.each(cases)("%s %s -> %s", (ecosystem, spec, expected) => {
    expect(stripVersionSpec(ecosystem, spec)).toBe(expected);
  });
});
