import { describe, expect, it } from "vitest";
import { parseGoMod } from "../src/parsers/go-mod.js";
import { parsePackageJson } from "../src/parsers/package-json.js";
import { parsePackageLock } from "../src/parsers/package-lock.js";
import { parsePdmLock } from "../src/parsers/pdm-lock.js";
import { parsePnpmLock } from "../src/parsers/pnpm-lock.js";
import { parseDependencyFile, isSupportedDependencyFile } from "../src/parsers/index.js";
import { parsePoetryLock } from "../src/parsers/poetry-lock.js";
import { parsePyproject } from "../src/parsers/pyproject.js";
import { parsePythonRequirements } from "../src/parsers/python-requirements.js";
import { parseUvLock } from "../src/parsers/uv-lock.js";
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

describe("Go dependency parsers", () => {
  it("extracts go.mod require directives and skips replaced modules", () => {
    const parsed = parseGoMod({
      sourceFile: "go.mod",
      content: `
module example.com/service

go 1.24

require github.com/gin-gonic/gin v1.10.0

require (
  github.com/stretchr/testify v1.10.0
  golang.org/x/mod v0.27.0 // indirect
  example.local/internal v0.1.0
)

replace github.com/stretchr/testify => ../testify

replace (
  golang.org/x/mod => golang.org/x/mod v0.28.0
)
`
    });

    expect(
      parsed.references.map((reference) => ({
        ecosystem: reference.ecosystem,
        name: reference.name,
        versionRange: reference.versionRange,
        sourceLine: reference.sourceLine,
        sourceKind: reference.sourceKind,
        isDirect: reference.isDirect
      }))
    ).toEqual([
      {
        ecosystem: "go",
        name: "github.com/gin-gonic/gin",
        versionRange: "v1.10.0",
        sourceLine: 6,
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "go",
        name: "golang.org/x/mod",
        versionRange: "v0.28.0",
        sourceLine: 17,
        sourceKind: "manifest",
        isDirect: true
      }
    ]);
  });

  it("parses go.mod through dependency file discovery", () => {
    expect(isSupportedDependencyFile("go.mod")).toBe(true);

    const parsed = parseDependencyFile({
      sourceFile: "go.mod",
      content: `
module example.com/service

go 1.24

require github.com/missing/module v1.0.0
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "github.com/missing/module"
    ]);
    expect(parsed.references[0]?.ecosystem).toBe("go");
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
    expect(isSupportedDependencyFile("pdm.lock")).toBe(true);
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

  it("extracts package entries from pdm.lock", () => {
    const parsed = parsePdmLock({
      sourceFile: "pdm.lock",
      content: `
[metadata]
groups = ["default"]
lock_version = "4.5.0"

[[package]]
name = "Django"
version = "5.0.1"
summary = "A web framework"
groups = ["default"]
dependencies = [
  "asgiref>=3.7.0",
]
files = [
  {file = "Django-5.0.1-py3-none-any.whl", hash = "sha256:test"},
]

[[package]]
name = "zope.interface"
version = "6.1"
groups = ["default"]
files = [
  {file = "zope.interface-6.1.tar.gz", hash = "sha256:test"},
]
`
    });

    expect(
      parsed.references.map((reference) => ({
        ecosystem: reference.ecosystem,
        name: reference.name,
        versionRange: reference.versionRange,
        sourceKind: reference.sourceKind,
        isDirect: reference.isDirect,
        sourceLine: reference.sourceLine
      }))
    ).toEqual([
      {
        ecosystem: "pypi",
        name: "django",
        versionRange: "5.0.1",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 7
      },
      {
        ecosystem: "pypi",
        name: "zope-interface",
        versionRange: "6.1",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 19
      }
    ]);
  });

  it("skips local and static URL pdm.lock package entries", () => {
    const parsed = parsePdmLock({
      sourceFile: "pdm.lock",
      content: `
[[package]]
name = "requests"
version = "2.32.0"
groups = ["default"]

[[package]]
name = "local-path"
version = "0.1.0"
editable = true
path = "../local-path"

[[package]]
name = "local-directory"
version = "0.1.0"
directory = "../local-directory"

[[package]]
name = "git-package"
version = "0.1.0"
git = "https://github.com/example/git-package.git"

[[package]]
name = "url-package"
version = "0.1.0"
url = "https://example.invalid/url-package-0.1.0.whl"

[[package]]
name = "source-url-package"
version = "0.1.0"
source = { type = "url", url = "https://example.invalid/source-url-package-0.1.0.whl" }

[[package]]
name = "source-path-package"
version = "0.1.0"
source = { path = "../source-path-package" }

[[package]]
name = "source-editable-package"
version = "0.1.0"
source = { editable = "../source-editable-package" }
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "requests"
    ]);
  });

  it("parses pdm.lock through dependency file discovery", () => {
    expect(isSupportedDependencyFile("pdm.lock")).toBe(true);

    const parsed = parseDependencyFile({
      sourceFile: "pdm.lock",
      content: `
[[package]]
name = "missing-python-package"
version = "1.0.0"
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "missing-python-package"
    ]);
    expect(parsed.references[0]?.ecosystem).toBe("pypi");
  });

  it("extracts PyPI registry packages from uv.lock and skips non-registry sources", () => {
    const parsed = parseUvLock({
      sourceFile: "uv.lock",
      content: `
version = 1
revision = 2
requires-python = ">=3.12"

[[package]]
name = "Requests"
version = "2.34.2"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "zope.interface"
version = "6.0.0"
source = { registry = "https://pypi.org/simple/" }

[[package]]
name = "private-package"
version = "1.0.0"
source = { registry = "https://packages.example.test/simple" }

[[package]]
name = "path-package"
version = "1.0.0"
source = { path = "../path-package" }

[[package]]
name = "directory-package"
version = "1.0.0"
source = { directory = "../directory-package" }

[[package]]
name = "editable-package"
version = "1.0.0"
source = { editable = "../editable-package" }

[[package]]
name = "git-package"
version = "1.0.0"
source = { git = "https://github.com/example/git-package" }

[[package]]
name = "url-package"
version = "1.0.0"
source = { url = "https://example.test/url-package-1.0.0.tar.gz" }

[[package]]
name = "workspace-package"
version = "1.0.0"
source = { workspace = true }

[[package]]
name = "member-package"
version = "1.0.0"
source = { member = "packages/member-package" }

[[package]]
name = "project"
version = "0.1.0"
source = { virtual = "." }
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "requests",
      "zope-interface"
    ]);
    expect(parsed.references.map((reference) => reference.sourceKind)).toEqual([
      "lockfile",
      "lockfile"
    ]);
    expect(parsed.references.map((reference) => reference.isDirect)).toEqual([
      false,
      false
    ]);
  });

  it("parses uv.lock through dependency file discovery", () => {
    expect(isSupportedDependencyFile("uv.lock")).toBe(true);

    const parsed = parseDependencyFile({
      sourceFile: "uv.lock",
      content: `
version = 1

[[package]]
name = "missing-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }
`
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "missing-python-package"
    ]);
    expect(parsed.references[0]?.ecosystem).toBe("pypi");
  });
});
