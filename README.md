# SlopLock

SlopLock blocks newly introduced dependency names that are nonexistent or too new in public package registries.

It is built for pull request gating: scan only dependency changes, check the public registry, and fail before a hallucinated or freshly registered package lands in your repo.

## Quick Start

```bash
npx --yes sloplock@latest .
```

Run only one ecosystem:

```bash
npx --yes sloplock@latest . --ecosystem npm
npx --yes sloplock@latest . --ecosystem pypi
npx --yes sloplock@latest . --ecosystem go
npx --yes sloplock@latest . --ecosystem crates
npx --yes sloplock@latest . --ecosystem nuget
npx --yes sloplock@latest . --ecosystem packagist
npx --yes sloplock@latest . --ecosystem rubygems
```

Scan only dependencies introduced since a base ref:

```bash
npx --yes sloplock@latest . --changed-only --base origin/main
```

## GitHub Action

Use a full checkout history when `changed-only` is enabled.

```yaml
name: SlopLock

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  sloplock:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: theinfosecguy/sloplock@v0.1.0
        with:
          ecosystem: all
          fail-on: high
          changed-only: true
          comment: true
```

## Supported Inputs

| Ecosystem | Registry | Files |
| --- | --- | --- |
| npm | npm registry | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` |
| PyPI | PyPI JSON API | `requirements*.txt`, `*-requirements.txt`, `constraints*.txt`, `*-constraints.txt`, `pyproject.toml`, `pdm.lock`, `poetry.lock`, `uv.lock` |
| Go | Go module proxy | `go.mod` |
| Rust | crates.io | `Cargo.toml`, `Cargo.lock` |
| .NET | NuGet.org | `*.csproj`, `Directory.Packages.props`, `packages.config`, `packages.lock.json` |
| PHP | Packagist | `composer.json`, `composer.lock` |
| Ruby | RubyGems.org | `Gemfile`, `Gemfile.lock` |

SlopLock skips local, workspace, path, git, editable, alternate-registry, and private-source dependencies where the supported file format exposes that information. Go private modules can also be skipped with `GOPRIVATE`, `GONOPROXY`, or `go.privateModules` in config.

## What It Checks

- `package_not_found`: the dependency name does not exist in npm, PyPI, the Go module proxy, crates.io, NuGet.org, Packagist, or RubyGems.org.
- `package_too_new`: the dependency exists, but its first observed publish time is inside the configured cooldown window.

SlopLock is not an SCA scanner, vulnerability scanner, typosquat detector, install-script analyzer, or package reputation score.

## CLI

```text
Usage: sloplock [options] [path]

Options:
  --format <format>        text, json, or markdown
  --fail-on <severity>     medium or high
  --ecosystem <ecosystem>  crates, go, npm, nuget, packagist, pypi, or rubygems
  --changed-only           scan only dependencies added since --base
  --base <ref>             base git ref for --changed-only
  --config <path>          config file. Default: sloplock.yml
  --fail-closed            exit 3 on registry/network failures
```

Exit codes:

- `0`: no findings at or above `fail-on`
- `1`: findings at or above `fail-on`
- `2`: usage or configuration error
- `3`: registry/network failure with `--fail-closed`

## Configuration

Create `sloplock.yml` in the scan root.

```yaml
failOn: high

ecosystems:
  - npm
  - pypi
  - go
  - crates
  - nuget
  - packagist
  - rubygems

cooldown:
  highDays: 7
  mediumDays: 30

go:
  privateModules:
    - github.com/my-org/*
    - corp.example.com

allow:
  - ecosystem: npm
    package: known-internal-name
    reason: internal package mirrored outside npm
    expires: 2026-12-31

ignore:
  - rule: package_too_new
    ecosystem: pypi
    package: reviewed-package
    reason: reviewed by platform team
    expires: 2026-12-31
```

In CI, SlopLock warns when `allow` or `ignore` entries do not include `expires`.

## Output

Use JSON for automation:

```bash
npx --yes sloplock@latest . --format json
```

The JSON report includes a summary, warnings, registry failures, and findings with rule, severity, ecosystem, package, source, evidence, and recommendation fields.

## Development

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke:ecosystems
npm run pack:dry-run
npm run smoke:package
```

`npm run smoke:ecosystems` exercises the built CLI and bundled GitHub Action across npm, PyPI, Go, crates.io, NuGet.org, Packagist, and RubyGems.org fixtures. `npm run smoke:package` packs the package, installs the tarball into a temporary project, and verifies the published CLI entry point.
