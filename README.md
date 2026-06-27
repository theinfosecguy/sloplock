# SlopLock

SlopLock is a GitHub Action that blocks AI-hallucinated, nonexistent, and too-new dependency names before they merge.

It is built for pull request gating: scan only newly introduced dependency names, check public package registries, and fail before a typo, hallucination, or freshly registered package lands in your repository.

## Add SlopLock To A Repository

Use the [GitHub Marketplace listing](https://github.com/marketplace/actions/sloplock)
or create `.github/workflows/sloplock.yml`.

```yaml
name: SlopLock

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  sloplock:
    name: SlopLock dependency gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: theinfosecguy/sloplock@v1
```

That default workflow:

- scans only dependency names introduced by the pull request
- checks all supported ecosystems
- writes annotations and a job summary
- updates one sticky pull request comment when `pull-requests: write` is allowed
- fails the job on high-severity findings

## Common Action Setups

### Read-Only Permissions

Use this when organization policy does not allow pull request comments. SlopLock still reports through annotations, logs, and the step summary.

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - uses: theinfosecguy/sloplock@v1
    with:
      comment: false
```

### Strict Pull Request Gate

```yaml
permissions:
  contents: read
  pull-requests: write

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - uses: theinfosecguy/sloplock@v1
    with:
      fail-on: medium
      fail-closed: true
```

### Monorepo Or Subdirectory Scan

```yaml
permissions:
  contents: read
  pull-requests: write

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - uses: theinfosecguy/sloplock@v1
    with:
      path: packages/api
      ecosystem: npm
```

### Required Status Check

After the workflow runs once, make `SlopLock dependency gate` a required status check in your branch protection rule or repository ruleset. That turns SlopLock from an advisory comment into a merge gate.

Set `ecosystem` to `all`, `npm`, `pypi`, `go`, `crates`, `maven`, `nuget`,
`packagist`, or `rubygems`. The Action works with read-only repository
permissions through logs, annotations, and the step summary; `comment: true`
needs `pull-requests: write`.

## Supported Inputs

| Ecosystem | Registry | Files |
| --- | --- | --- |
| npm | npm registry | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` |
| PyPI | PyPI JSON API | `requirements*.txt`, `*-requirements.txt`, `constraints*.txt`, `*-constraints.txt`, `pyproject.toml`, `pdm.lock`, `poetry.lock`, `uv.lock` |
| Go | Go module proxy | `go.mod` |
| Rust | crates.io | `Cargo.toml`, `Cargo.lock` |
| Maven/JVM | Maven Central | `pom.xml`, `gradle.lockfile`, `buildscript-gradle.lockfile` |
| .NET | NuGet.org | `*.csproj`, `Directory.Packages.props`, `packages.config`, `packages.lock.json` |
| PHP | Packagist | `composer.json`, `composer.lock` |
| Ruby | RubyGems.org | `Gemfile`, `Gemfile.lock` |

SlopLock skips local, workspace, path, git, editable, alternate-registry, and private-source dependencies where the supported file format exposes that information. Go private modules can also be skipped with `GOPRIVATE`, `GONOPROXY`, or `go.privateModules` in config.

For NuGet, `NuGet.config` package source mappings are used to keep packages
mapped only to private sources out of NuGet.org checks. If a private NuGet feed
does not use package source mapping, configure `nuget.privatePackages` with exact
package names or `*` patterns. Composer repositories and Ruby source blocks are
handled conservatively: dependencies that are tied to non-Packagist or
non-RubyGems.org sources are skipped instead of being reported as public
registry misses.

For Maven, SlopLock reads raw `pom.xml` files and Gradle dependency lockfiles
only. It does not run Maven or Gradle, read effective POMs, resolve parents,
activate profiles, or parse Gradle build scripts. It checks direct project
dependencies, imported BOMs, and Gradle lockfile entries by `groupId:artifactId`.
Unresolved property-backed coordinates, `system` scope dependencies, snapshots,
profiles, plugin dependencies, and ordinary dependency-management entries are
skipped. If a POM declares custom repositories, or a coordinate comes from a
Gradle lockfile that does not record repository source, Maven Central `not found`
results become warnings instead of findings unless Central proves the coordinate
is public. SlopLock does not parse `build.gradle`, `build.gradle.kts`, or Gradle
version catalogs.

## What It Checks

- `package_not_found`: the dependency name does not exist in npm, PyPI, the Go module proxy, crates.io, Maven Central, NuGet.org, Packagist, or RubyGems.org.
- `package_too_new`: the dependency exists, but its first observed publish time is inside the configured cooldown window.

SlopLock is not an SCA scanner, vulnerability scanner, typosquat detector, install-script analyzer, or package reputation score.

## Configuration

Create `sloplock.yml` in the scan root.

```yaml
failOn: high

ecosystems:
  - npm
  - pypi
  - go
  - crates
  - maven
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

nuget:
  privatePackages:
    - MyCompany.*
    - Internal.Package

allow:
  - ecosystem: npm
    package: known-internal-name
    reason: internal package mirrored outside npm
    expires: 2026-12-31
  - ecosystem: packagist
    package: my-org/internal-package
    reason: private package confirmed by platform team
    expires: 2026-12-31
  - ecosystem: rubygems
    package: internal-gem
    reason: private gem confirmed by platform team
    expires: 2026-12-31
  - ecosystem: maven
    package: com.my-org:internal-lib
    reason: private Maven artifact confirmed by platform team
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

The Action writes annotations, logs, a step summary, and an optional sticky pull
request comment. JSON output is available for local debugging and automation;
the report includes a summary, warnings, registry failures, and findings with
rule, severity, ecosystem, package, source, evidence, and recommendation fields.

For local reproduction outside GitHub Actions, see [`docs/cli.md`](docs/cli.md).

## Development

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run check:dist-policy
npm run smoke:ecosystems
npm run pack:dry-run
npm run smoke:package
```

`npm run smoke:ecosystems` exercises the shared scanner, CLI entry point, and
bundled GitHub Action across npm, PyPI, Go, crates.io, Maven Central, NuGet.org,
Packagist, and RubyGems.org fixtures. `npm run smoke:package` packs the package,
installs the tarball into a temporary project, and verifies the published CLI
entry point.

Longer repo-maintenance commands live under `scripts/` by domain while
`package.json` keeps the stable contributor-facing command names.

Release and Marketplace steps live in [`docs/release.md`](docs/release.md).

`dist/` is committed because `action.yml` runs the bundled JavaScript Action
from `dist/action/index.cjs`, but feature PRs should leave generated artifacts
out. CI builds fresh artifacts for tests and smoke checks on every PR. After a
batch of source changes lands on `main`, run `npm run build` from `main` and
open a dedicated generated-artifact refresh PR that contains only `dist/`
changes. Dist-only PRs and version-tag checks verify that committed `dist/` is
current.
