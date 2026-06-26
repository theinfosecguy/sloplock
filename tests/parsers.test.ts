import { describe, expect, it } from "vitest";
import { parseCargoLock } from "../src/parsers/cargo-lock.js";
import { parseCargoToml } from "../src/parsers/cargo-toml.js";
import { parseComposerJson } from "../src/parsers/composer-json.js";
import { parseComposerLock } from "../src/parsers/composer-lock.js";
import { parseGemfile } from "../src/parsers/gemfile.js";
import { parseGemfileLock } from "../src/parsers/gemfile-lock.js";
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

describe("PHP Composer dependency parsers", () => {
  it("extracts Packagist dependencies from composer.json and skips platform packages", () => {
    const parsed = parseComposerJson({
      sourceFile: "composer.json",
      content: `
{
  "require": {
    "Monolog/Monolog": "^3.0",
    "Acme/Upper": "1.0.0",
    "php": "^8.3",
    "ext-json": "*",
    "lib-curl": "*",
    "composer-plugin-api": "^2.0",
    "acme/private": "dev-main",
    "private/package": "1.0.0"
  },
  "require-dev": {
    "phpunit/phpunit": "^11.0"
  },
  "repositories": [
    {
      "type": "composer",
      "url": "https://packages.example.invalid",
      "only": ["acme/private"]
    },
    {
      "type": "package",
      "package": {
        "name": "private/package",
        "version": "1.0.0"
      }
    }
  ]
}
`
    });

    expect(
      parsed.references.map((reference) => ({
        ecosystem: reference.ecosystem,
        name: reference.name,
        versionRange: reference.versionRange,
        sourceKind: reference.sourceKind,
        isDirect: reference.isDirect
      }))
    ).toEqual([
      {
        ecosystem: "packagist",
        name: "monolog/monolog",
        versionRange: "^3.0",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "packagist",
        name: "acme/upper",
        versionRange: "1.0.0",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "packagist",
        name: "phpunit/phpunit",
        versionRange: "^11.0",
        sourceKind: "manifest",
        isDirect: true
      }
    ]);
  });

  it("skips composer.json dependencies when Packagist is disabled", () => {
    const parsed = parseComposerJson({
      sourceFile: "composer.json",
      content: JSON.stringify({
        require: {
          "monolog/monolog": "^3.0"
        },
        repositories: [
          {
            "packagist.org": false
          }
        ]
      })
    });

    expect(parsed.references).toEqual([]);
  });

  it("skips composer.json dependencies behind unconstrained path repositories", () => {
    const parsed = parseComposerJson({
      sourceFile: "composer.json",
      content: JSON.stringify({
        require: {
          "acme/local": "dev-main"
        },
        repositories: [
          {
            type: "path",
            url: "../packages/*"
          }
        ]
      })
    });

    expect(parsed.references).toEqual([]);
  });

  it("skips composer.json dependencies behind broad private repository overrides", () => {
    const parsed = parseComposerJson({
      sourceFile: "composer.json",
      content: JSON.stringify({
        require: {
          "acme/private": "dev-main",
          "public/package": "^1.0"
        },
        repositories: [
          {
            type: "composer",
            url: "https://packages.example.invalid",
            canonical: false,
            exclude: ["public/package"]
          }
        ]
      })
    });

    expect(parsed.references).toEqual([]);
  });

  it("keeps composer.json dependencies when only public Packagist is configured", () => {
    const parsed = parseComposerJson({
      sourceFile: "composer.json",
      content: JSON.stringify({
        require: {
          "monolog/monolog": "^3.0"
        },
        repositories: [
          {
            type: "composer",
            url: "https://repo.packagist.org"
          }
        ]
      })
    });

    expect(parsed.references.map((reference) => reference.name)).toEqual([
      "monolog/monolog"
    ]);
  });

  it("extracts Packagist packages from composer.lock and skips private sources", () => {
    const parsed = parseComposerLock({
      sourceFile: "composer.lock",
      content: JSON.stringify(
        {
          packages: [
            {
              name: "Monolog/Monolog",
              version: "3.9.0",
              source: {
                type: "git",
                url: "https://github.com/Seldaek/monolog.git"
              },
              dist: {
                type: "zip",
                url: "https://api.github.com/repos/Seldaek/monolog/zipball/test"
              },
              "notification-url": "https://packagist.org/downloads/"
            },
            {
              name: "private/package",
              version: "1.0.0",
              "notification-url": "https://packages.example.invalid/downloads/"
            },
            {
              name: "vcs/package",
              version: "1.0.0",
              source: {
                type: "git",
                url: "https://github.com/example/vcs-package.git"
              }
            },
            {
              name: "ambiguous/package",
              version: "1.0.0"
            }
          ],
          "packages-dev": [
            {
              name: "phpunit/phpunit",
              version: "11.0.0",
              "notification-url": "https://packagist.org/downloads/"
            }
          ]
        },
        null,
        2
      )
    });

    expect(
      parsed.references.map((reference) => ({
        ecosystem: reference.ecosystem,
        name: reference.name,
        versionRange: reference.versionRange,
        sourceKind: reference.sourceKind,
        isDirect: reference.isDirect
      }))
    ).toEqual([
      {
        ecosystem: "packagist",
        name: "monolog/monolog",
        versionRange: "3.9.0",
        sourceKind: "lockfile",
        isDirect: false
      },
      {
        ecosystem: "packagist",
        name: "phpunit/phpunit",
        versionRange: "11.0.0",
        sourceKind: "lockfile",
        isDirect: false
      }
    ]);
  });

  it("parses Composer files through dependency file discovery", () => {
    expect(isSupportedDependencyFile("composer.json")).toBe(true);
    expect(isSupportedDependencyFile("composer.lock")).toBe(true);

    const manifest = parseDependencyFile({
      sourceFile: "composer.json",
      content: JSON.stringify({
        require: {
          "monolog/monolog": "^3.0"
        }
      })
    });
    const lockfile = parseDependencyFile({
      sourceFile: "composer.lock",
      content: JSON.stringify({
        packages: [
          {
            name: "monolog/monolog",
            version: "3.9.0",
            "notification-url": "https://packagist.org/downloads/"
          }
        ]
      })
    });

    expect(manifest.references[0]?.ecosystem).toBe("packagist");
    expect(manifest.references[0]?.name).toBe("monolog/monolog");
    expect(lockfile.references[0]?.ecosystem).toBe("packagist");
    expect(lockfile.references[0]?.name).toBe("monolog/monolog");
  });
});

describe("Rust dependency parsers", () => {
  it("extracts registry dependencies from Cargo.toml and skips non-crates.io specs", () => {
    const parsed = parseCargoToml({
      sourceFile: "Cargo.toml",
      content: `
[package]
name = "fixture"
version = "0.1.0"

[dependencies]
serde = "1"
serde_json = { version = "1", package = "serde-json" }
local-crate = { path = "../local-crate" }
git-crate = { git = "https://github.com/example/git-crate" }
private-crate = { version = "1", registry = "private" }
workspace-crate = { workspace = true }

[dev-dependencies]
tempfile = "3"

[build-dependencies]
cc = { version = "1" }

[target.'cfg(unix)'.dependencies]
nix = "0.29"

[workspace.dependencies]
workspace-serde = { package = "serde", version = "1" }
`
    });

    expect(
      parsed.references.map((reference) => ({
        ecosystem: reference.ecosystem,
        name: reference.name,
        versionRange: reference.versionRange,
        sourceKind: reference.sourceKind,
        isDirect: reference.isDirect
      }))
    ).toEqual([
      {
        ecosystem: "crates",
        name: "serde",
        versionRange: "1",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "crates",
        name: "serde-json",
        versionRange: "1",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "crates",
        name: "tempfile",
        versionRange: "3",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "crates",
        name: "cc",
        versionRange: "1",
        sourceKind: "manifest",
        isDirect: true
      },
      {
        ecosystem: "crates",
        name: "nix",
        versionRange: "0.29",
        sourceKind: "manifest",
        isDirect: true
      }
    ]);
  });

  it("extracts crates.io packages from Cargo.lock and skips local and alternate sources", () => {
    const parsed = parseCargoLock({
      sourceFile: "Cargo.lock",
      content: `
version = 3

[[package]]
name = "fixture"
version = "0.1.0"

[[package]]
name = "serde"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "serde_json"
version = "1.0.0"
source = "registry+https://index.crates.io/"

[[package]]
name = "git-crate"
version = "0.1.0"
source = "git+https://github.com/example/git-crate"

[[package]]
name = "private-crate"
version = "0.1.0"
source = "registry+https://example.invalid/index"
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
        ecosystem: "crates",
        name: "serde",
        versionRange: "1.0.0",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 9
      },
      {
        ecosystem: "crates",
        name: "serde_json",
        versionRange: "1.0.0",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 14
      }
    ]);
  });

  it("parses Cargo files through dependency file discovery", () => {
    expect(isSupportedDependencyFile("Cargo.toml")).toBe(true);
    expect(isSupportedDependencyFile("Cargo.lock")).toBe(true);

    const manifest = parseDependencyFile({
      sourceFile: "Cargo.toml",
      content: `
[dependencies]
serde = "1"
`
    });
    const lockfile = parseDependencyFile({
      sourceFile: "Cargo.lock",
      content: `
[[package]]
name = "serde"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"
`
    });

    expect(manifest.references[0]?.ecosystem).toBe("crates");
    expect(manifest.references[0]?.name).toBe("serde");
    expect(lockfile.references[0]?.ecosystem).toBe("crates");
    expect(lockfile.references[0]?.name).toBe("serde");
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

describe("RubyGems dependency parsers", () => {
  it("extracts RubyGems packages from Gemfile.lock and skips nested dependency rows", () => {
    const parsed = parseGemfileLock({
      sourceFile: "Gemfile.lock",
      content: `
GEM
  remote: https://rubygems.org/
  specs:
    actionpack (7.1.0)
      rack (~> 3.0)
    rake (13.0.6)

GIT
  remote: https://github.com/example/private-gem.git
  specs:
    private-gem (0.1.0)

PATH
  remote: ../local-gem
  specs:
    local-gem (0.1.0)
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
        ecosystem: "rubygems",
        name: "actionpack",
        versionRange: "7.1.0",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 5
      },
      {
        ecosystem: "rubygems",
        name: "rake",
        versionRange: "13.0.6",
        sourceKind: "lockfile",
        isDirect: false,
        sourceLine: 7
      }
    ]);
  });

  it("skips Gemfile.lock GEM sections with non-RubyGems remotes", () => {
    const parsed = parseGemfileLock({
      sourceFile: "Gemfile.lock",
      content: `
GEM
  remote: https://gems.example.invalid/
  specs:
    private-gem (1.0.0)

GEM
  remote: https://rubygems.org/
  remote: https://gems.example.invalid/
  specs:
    mixed-source-gem (1.0.0)
`
    });

    expect(parsed.references).toEqual([]);
  });

  it("extracts conservative Gemfile gem lines from RubyGems source contexts", () => {
    const parsed = parseGemfile({
      sourceFile: "Gemfile",
      content: `
source "https://rubygems.org"

gem "rails", "~> 7.1"
gem 'rack'
gem "local-gem", path: "../local-gem"
gem "git-gem", git: "https://github.com/example/git-gem"

source "https://gems.example.invalid" do
  gem "private-gem"
end

source "https://rubygems.org" do
  gem "public-block-gem", "1.0.0"
end
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
        ecosystem: "rubygems",
        name: "rails",
        versionRange: "~> 7.1",
        sourceKind: "manifest",
        isDirect: true,
        sourceLine: 4
      },
      {
        ecosystem: "rubygems",
        name: "rack",
        versionRange: undefined,
        sourceKind: "manifest",
        isDirect: true,
        sourceLine: 5
      },
      {
        ecosystem: "rubygems",
        name: "public-block-gem",
        versionRange: "1.0.0",
        sourceKind: "manifest",
        isDirect: true,
        sourceLine: 14
      }
    ]);
  });

  it("skips Gemfile gem lines without a public RubyGems source context", () => {
    const parsed = parseGemfile({
      sourceFile: "Gemfile",
      content: `
gem "unknown-source-gem"

source "https://gems.example.invalid"
gem "private-default-gem"
`
    });

    expect(parsed.references).toEqual([]);
  });

  it("parses Ruby files through dependency file discovery", () => {
    expect(isSupportedDependencyFile("Gemfile")).toBe(true);
    expect(isSupportedDependencyFile("Gemfile.lock")).toBe(true);

    const manifest = parseDependencyFile({
      sourceFile: "Gemfile",
      content: `
source "https://rubygems.org"
gem "rails"
`
    });
    const lockfile = parseDependencyFile({
      sourceFile: "Gemfile.lock",
      content: `
GEM
  remote: https://rubygems.org/
  specs:
    rake (13.0.6)
`
    });

    expect(manifest.references[0]?.ecosystem).toBe("rubygems");
    expect(manifest.references[0]?.name).toBe("rails");
    expect(lockfile.references[0]?.ecosystem).toBe("rubygems");
    expect(lockfile.references[0]?.name).toBe("rake");
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
    expect(isSupportedDependencyFile("poetry.lock")).toBe(true);
    expect(isSupportedDependencyFile("uv.lock")).toBe(true);
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
    expect(
      parsed.references.map((reference) => ({
        name: reference.name,
        sourceKind: reference.sourceKind,
        sourceLine: reference.sourceLine
      }))
    ).toEqual([
      {
        name: "django",
        sourceKind: "lockfile",
        sourceLine: 3
      },
      {
        name: "zope-interface",
        sourceKind: "lockfile",
        sourceLine: 11
      }
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

  it("parses poetry.lock through dependency file discovery", () => {
    expect(isSupportedDependencyFile("poetry.lock")).toBe(true);

    const parsed = parseDependencyFile({
      sourceFile: "poetry.lock",
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
    expect(parsed.references[0]?.sourceLine).toBe(3);
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

[[package]]
name = "private-registry-package"
version = "1.0.0"
source = { registry = "https://packages.example.invalid/simple" }
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
