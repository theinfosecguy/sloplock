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
  --base <ref>             base git ref for --changed-only
  --config <path>          config file. Default: sloplock.yml
  --fail-closed            exit 3 on registry/network failures
```

## Exit Codes

- `0`: no findings at or above `fail-on`
- `1`: findings at or above `fail-on`
- `2`: usage or configuration error
- `3`: registry/network failure with `--fail-closed`
