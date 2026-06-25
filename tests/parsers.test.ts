import { describe, expect, it } from "vitest";
import { parsePackageJson } from "../src/parsers/package-json.js";
import { parsePackageLock } from "../src/parsers/package-lock.js";
import { parsePnpmLock } from "../src/parsers/pnpm-lock.js";
import { parseYarnLock } from "../src/parsers/yarn-lock.js";

describe("npm dependency parsers", () => {
  it("extracts registry dependencies from package.json and skips local specs", () => {
    const parsed = parsePackageJson({
      sourceFile: "package.json",
      content: JSON.stringify(
        {
          dependencies: {
            react: "^19.0.0",
            alias: "npm:@scope/real-package@^1.0.0",
            local: "file:../local",
            workspace: "workspace:*"
          },
          devDependencies: {
            vitest: "^3.0.0"
          }
        },
        null,
        2
      )
    });

    expect(parsed.references.map((reference) => reference.name).sort()).toEqual([
      "@scope/real-package",
      "react",
      "vitest"
    ]);
  });

  it("extracts package-lock package entries", () => {
    const parsed = parsePackageLock({
      sourceFile: "package-lock.json",
      content: JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/react": { version: "19.0.0" },
          "node_modules/@scope/pkg": { version: "1.0.0" }
        }
      })
    });

    expect(parsed.references.map((reference) => reference.name).sort()).toEqual([
      "@scope/pkg",
      "react"
    ]);
  });

  it("skips local package-lock package entries", () => {
    const parsed = parsePackageLock({
      sourceFile: "package-lock.json",
      content: JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/sloplock": {
            version: "0.1.0",
            resolved: "file:sloplock-0.1.0.tgz"
          },
          "node_modules/react": {
            version: "19.0.0",
            resolved: "https://registry.npmjs.org/react/-/react-19.0.0.tgz"
          }
        }
      })
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual(["react"]);
  });

  it("extracts pnpm lock importers and package entries", () => {
    const parsed = parsePnpmLock({
      sourceFile: "pnpm-lock.yaml",
      content: `
lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      react:
        specifier: ^19.0.0
        version: 19.0.0
packages:
  react@19.0.0:
    resolution: {integrity: sha512-test}
  '@scope/pkg@1.0.0':
    resolution: {integrity: sha512-test}
`
    });

    expect(parsed.references.map((reference) => reference.name).sort()).toEqual([
      "@scope/pkg",
      "react"
    ]);
  });

  it("extracts yarn lock descriptors", () => {
    const parsed = parseYarnLock({
      sourceFile: "yarn.lock",
      content: `
"react@^19.0.0":
  version "19.0.0"

"@scope/pkg@npm:^1.0.0":
  version "1.0.0"
`
    });

    expect(parsed.references.map((reference) => reference.name).sort()).toEqual([
      "@scope/pkg",
      "react"
    ]);
  });
});
