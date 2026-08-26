# SlopLock CLI Reference

SlopLock is promoted as a GitHub Action first. The CLI is available for local
debugging, reproducing Action results, and automation that cannot run inside
GitHub Actions.

## Run Locally

```bash
npx --yes sloplock@latest .
```

Scan one ecosystem:

```bash
npx --yes sloplock@latest . --ecosystem npm
```

Scan only dependencies introduced since a base ref:

```bash
npx --yes sloplock@latest . --changed-only --base origin/main
```

Emit JSON:

```bash
npx --yes sloplock@latest . --format json
```

## Options

```text
Usage: sloplock [options] [path]

Options:
  --format <format>        text, json, or markdown
  --fail-on <severity>     medium or high
  --ecosystem <ecosystem>  crates, go, maven, npm, nuget, packagist, pypi, or rubygems
  --changed-only           scan only dependencies added since --base
  --base <ref>             base git ref for --changed-only. Default: the remote default branch, or origin/main
  --config <path>          config file. Default: sloplock.yml
  --fail-closed            exit 3 on registry/network failures
```

## Commands

- `sloplock check <ecosystem> <name...>`: check package names against their
  public registry without a checkout. Accepts `--format text|json`,
  `--fail-on`, `--config`, and `--fail-closed`, and uses the same exit codes as
  a scan. `sloplock.yml` in the current directory applies. A trailing version
  specifier (`express@4`, `requests==2.32.0`, `serde@1`, `vendor/pkg:^1.0`,
  `com.acme:lib:1.0`) is ignored. `sloplock check --help` lists the options.

  ```bash
  npx --yes sloplock@latest check npm express fastapi-auth-helper
  npx --yes sloplock@latest check pypi requests --format json
  ```

- `sloplock hook`: run as a Claude Code `PreToolUse` hook. Reads the hook event
  on stdin and blocks package installs that fail the checks. See
  [`hook.md`](hook.md).

## Exit Codes

- `0`: no findings at or above `fail-on`
- `1`: findings at or above `fail-on`
- `2`: usage or configuration error
- `3`: registry/network failure with `--fail-closed`
