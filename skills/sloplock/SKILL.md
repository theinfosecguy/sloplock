---
name: sloplock
description: Verifies that package names exist on their public registry (npm, PyPI, crates.io, Go modules, RubyGems, Packagist, NuGet, Maven Central) and are old enough to trust, before they are installed or added to a manifest. Use before any install command such as npm install, pip install, uv add, cargo add, go get, gem install, composer require, or dotnet add package, whenever you add a dependency to package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod, Gemfile, composer.json, or a .csproj, and whenever a package name comes from memory, a suggestion, or documentation rather than a verified source. Catches hallucinated, nonexistent, and freshly registered (slopsquatted) packages.
license: MIT
compatibility: Requires Node.js 22 or newer and network access to public package registries.
metadata:
  author: theinfosecguy
  repository: https://github.com/theinfosecguy/sloplock
---

# SlopLock

Package names recalled from memory are sometimes wrong, and attackers register
the wrong names so that installing them runs their code. Check every package
name against its registry before installing it. A check takes about a second.

## When To Use

- Before running an install command: `npm install`, `pnpm add`, `yarn add`,
  `npx`, `pip install`, `uv add`, `uvx`, `poetry add`, `cargo add`, `go get`,
  `gem install`, `bundle add`, `composer require`, `dotnet add package`.
- Before adding a dependency to a manifest by editing the file directly.
- When reviewing a change that adds dependencies.
- Whenever you are not certain a package name is real. Certainty from memory
  does not count.

## How To Check

```bash
npx -y sloplock@latest check <ecosystem> <name> [<name>...]
```

`<ecosystem>` is one of `npm`, `pypi`, `crates`, `go`, `rubygems`,
`packagist`, `nuget`, or `maven`. A trailing version specifier in the form the
ecosystem's own tooling uses is ignored: `express@4`, `requests==2.32.0`,
`serde@1`, `github.com/x/y@v1.2.0`, `rake:13`, `vendor/pkg:^1.0`,
`Foo.Bar@1.0`, `com.acme:lib:1.0`. Maven coordinates are `groupId:artifactId`.

```bash
npx -y sloplock@latest check npm express fastapi-auth-helper
npx -y sloplock@latest check pypi requests
npx -y sloplock@latest check go github.com/spf13/cobra
```

Example output:

```text
npm express: found in npm, first published 2010-12-29
npm fastapi-auth-helper: not found in npm

SlopLock found 1 findings

HIGH npm fastapi-auth-helper
  Rule: package_not_found
  Evidence: Package does not exist in the npm registry.
  Action: Verify the intended package name before installing or merging.
```

Exit codes: `0` no findings, `1` findings at or above the fail threshold, `2`
usage error, `3` registry failure with `--fail-closed`. Add `--format json` for
a machine-readable report with `results` and `findings` arrays.

## How To Act On The Result

- `package_not_found` (HIGH): do not install it. The name is wrong or
  invented. Find the real package by searching the registry or the upstream
  project's own documentation, check that name, or ask the user. Never pick a
  similar-looking name and install it instead.
- `package_too_new` (HIGH inside 7 days, MEDIUM inside 30 days by default): the
  package exists but was first published recently, which is the window in which
  squatted names are most dangerous. Tell the user the publish date and do not
  install without their explicit approval.
- Registry check failed: the result is inconclusive, not a pass. Say so, retry
  once, and ask the user if it still fails.
- Never add `allow` or `ignore` entries to `sloplock.yml` yourself. Those are
  the user's decision.

## After Editing A Manifest

Scan the checkout so every new dependency name is checked, not only the ones
you installed by hand:

```bash
npx -y sloplock@latest . --changed-only
```

`--changed-only` checks names added since the default branch; drop it to check
every dependency file in the directory.

## Notes

- If the project uses a private registry (`.npmrc`, `pip.conf`, a Cargo
  registry, an internal NuGet feed), a `not found` result may mean the package
  is private. Ask the user rather than assuming either way.
- In Claude Code the SlopLock plugin enforces these checks automatically on
  every install command. This skill is the manual equivalent for agents and
  workflows without the hook.
