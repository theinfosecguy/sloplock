import { describe, expect, it } from "vitest";
import { parsePackageJson } from "../src/parsers/package-json.js";
import { parsePackageLock } from "../src/parsers/package-lock.js";
import { parsePnpmLock } from "../src/parsers/pnpm-lock.js";
import { parseDependencyFile, isSupportedDependencyFile } from "../src/parsers/index.js";
import { parsePoetryLock } from "../src/parsers/poetry-lock.js";
import { parsePyproject } from "../src/parsers/pyproject.js";
import { parsePythonRequirements } from "../src/parsers/python-requirements.js";
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

  it("skips local package-lock v1 dependency entries", () => {
    const parsed = parsePackageLock({
      sourceFile: "package-lock.json",
      content: JSON.stringify({
        lockfileVersion: 1,
        dependencies: {
          "local-pkg": {
            version: "file:../local-pkg",
            resolved: "file:../local-pkg"
          },
          react: {
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

  it("skips local pnpm lock dependencies", () => {
    const parsed = parsePnpmLock({
      sourceFile: "pnpm-lock.yaml",
      content: `
lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      local-pkg:
        specifier: link:../local-pkg
        version: link:../local-pkg
      react:
        specifier: ^19.0.0
        version: 19.0.0
packages:
  local-pkg@link:../local-pkg:
    resolution: {directory: ../local-pkg, type: directory}
  react@19.0.0:
    resolution: {integrity: sha512-test}
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual(["react"]);
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

  it("skips local yarn lock descriptors", () => {
    const parsed = parseYarnLock({
      sourceFile: "yarn.lock",
      content: `
"local-pkg@file:../local-pkg":
  version "0.0.0"

"workspace-pkg@workspace:*":
  version "0.0.0-use.local"

"react@^19.0.0":
  version "19.0.0"
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual(["react"]);
  });
});

describe("PyPI dependency parsers", () => {
  it("extracts registry dependencies from requirements.txt", () => {
    const parsed = parsePythonRequirements({
      sourceFile: "requirements.txt",
      content: `
# comment
Django>=5.0
requests[security]==2.32.0 ; python_version >= "3.11"
zope.interface~=6.0
-r dev-requirements.txt
local @ file:///tmp/local
git+https://github.com/example/pkg.git
./local-package
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "django",
      "requests",
      "zope-interface"
    ]);
    expect(parsed.references.map((reference) => reference.ecosystem)).toEqual([
      "pypi",
      "pypi",
      "pypi"
    ]);
  });

  it("recognizes common Python requirements file names", () => {
    expect(isSupportedDependencyFile("requirements-dev.txt")).toBe(true);
    expect(isSupportedDependencyFile("dev-requirements.txt")).toBe(true);
    expect(isSupportedDependencyFile("constraints.txt")).toBe(true);
    expect(isSupportedDependencyFile("prod-constraints.txt")).toBe(true);
  });

  it("extracts includes from requirements files", () => {
    const parsed = parsePythonRequirements({
      sourceFile: "requirements.txt",
      content: `
-r requirements-dev.txt
--requirement=requirements-test.txt
-c constraints.txt
`
    });

    expect(parsed.includedFiles).toEqual([
      "requirements-dev.txt",
      "requirements-test.txt",
      "constraints.txt"
    ]);
  });

  it("parses common requirements file names as PyPI requirements", () => {
    const parsed = parseDependencyFile({
      sourceFile: "requirements-dev.txt",
      content: "missing-python-package==1.0.0\n"
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "missing-python-package"
    ]);
  });

  it("extracts registry dependencies from poetry.lock", () => {
    const parsed = parsePoetryLock({
      sourceFile: "poetry.lock",
      content: `
[[package]]
name = "Django"
version = "5.0.1"
description = "A high-level Python web framework."
optional = false
python-versions = ">=3.10"
files = []

[[package]]
name = "zope.interface"
version = "6.0"
description = "Interfaces for Python."
optional = false
python-versions = ">=3.7"
files = []
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "django",
      "zope-interface"
    ]);
    expect(parsed.references.map((reference) => reference.sourceKind)).toEqual([
      "lockfile",
      "lockfile"
    ]);
  });

  it("skips non-public poetry.lock package sources", () => {
    const parsed = parsePoetryLock({
      sourceFile: "poetry.lock",
      content: `
[[package]]
name = "requests"
version = "2.32.0"

[[package]]
name = "local-pkg"
version = "0.1.0"
[package.source]
type = "directory"
url = "../local-pkg"

[[package]]
name = "git-pkg"
version = "0.1.0"
[package.source]
type = "git"
url = "https://github.com/example/pkg.git"

[[package]]
name = "url-pkg"
version = "0.1.0"
[package.source]
type = "url"
url = "https://example.com/pkg.whl"

[[package]]
name = "private-index-pkg"
version = "1.0.0"
[package.source]
type = "legacy"
url = "https://packages.example.invalid/simple"
reference = "private"

[[package]]
name = "public-source-pkg"
version = "1.0.0"
[package.source]
type = "legacy"
url = "https://pypi.org/simple/"
reference = "pypi"
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "requests",
      "public-source-pkg"
    ]);
  });

  it("extracts dependencies from pyproject project metadata", () => {
    const parsed = parsePyproject({
      sourceFile: "pyproject.toml",
      content: `
[project]
dependencies = [
  "Django>=5.0",
]

[project.optional-dependencies]
dev = [
  "pytest~=8.0",
]
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "django",
      "pytest"
    ]);
  });

  it("extracts dependencies from Poetry tables and skips local specs", () => {
    const parsed = parsePyproject({
      sourceFile: "pyproject.toml",
      content: `
[tool.poetry.dependencies]
python = "^3.12"
requests = "^2.32"
local = { path = "../local" }

[tool.poetry.group.dev.dependencies]
pytest = { version = "^8.0" }
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "requests",
      "pytest"
    ]);
  });
});
