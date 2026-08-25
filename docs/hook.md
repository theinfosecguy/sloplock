# Claude Code Hook

`sloplock hook` runs as a Claude Code `PreToolUse` hook on the `Bash` tool. When
the agent is about to run a package install, the hook checks every package name
in the command against its public registry and blocks the command before
anything is downloaded or executed.

## Install

Requires SlopLock 2.1.0 or newer.

As a plugin, from inside Claude Code:

```text
/plugin marketplace add theinfosecguy/sloplock
/plugin install sloplock@sloplock
```

Or by hand, in `~/.claude/settings.json` or a project's `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "npx -y sloplock@2 hook",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

The plugin form runs the bundled `dist/hook/index.cjs` with no network access
at startup. The `npx` form is slower on first run while npm fetches the package.
Both need Node.js 22 or newer on `PATH`.

## What It Does

For each Bash command Claude Code is about to run, the hook looks for package
install commands, extracts the package names, and checks them with the same
rules as a scan:

| Result | Decision |
| --- | --- |
| A finding at or above `failOn` (default: `high`) | `deny`. The command does not run. The findings are shown to the agent so it can pick a real package. |
| A finding below `failOn`, such as a package published two weeks ago | `ask`. You are prompted with the finding and decide. |
| No findings | No decision. The normal permission flow applies. |
| The registry could not be reached | No decision. The agent is told which packages could not be verified. |

The hook never returns `allow`, so it cannot widen the permissions you have
already granted. Commands that are not installs exit immediately without a
registry request.

`sloplock.yml` in the session's working directory applies: `cooldown`, `failOn`,
`allow`, and `ignore` entries all work the same way they do for `sloplock .`.

## Recognized Commands

| Ecosystem | Commands |
| --- | --- |
| npm | `npm install`, `npm i`, `npm add`, `pnpm add`, `pnpm install`, `yarn add`, `bun add`, `bun install`, `npx`, `bunx`, `pnpm dlx`, `yarn dlx`, `bun x` |
| PyPI | `pip install`, `pip3 install`, `python -m pip install`, `uv add`, `uv pip install`, `uv tool install`, `uv tool run`, `uvx`, `pipx install`, `pipx run`, `poetry add`, `pdm add` |
| crates.io | `cargo add`, `cargo install` |
| Go | `go get`, `go install` |
| RubyGems | `gem install`, `bundle add` |
| Packagist | `composer require` |
| NuGet | `dotnet add package`, `dotnet package add` |

Install commands are found anywhere in a command line, including after `cd`,
`sudo`, `env`, or variable assignments, inside `if`/`while`/`for` bodies,
subshells, and command substitutions, and in chains joined with `&&`, `||`,
`;`, or `|`. Comments are ignored. Version specifiers are stripped. Local
paths, URLs, git sources, tarballs, workspace links, and `--git`/`--path` style
sources are skipped, as are `pip install -r` and `-e` targets.

A command that names an alternate registry is not checked at all, because the
package may legitimately exist only there and a public-registry answer would be
wrong in both directions. This covers `--registry`, `--index-url`, `-i`,
`--extra-index-url`, `--find-links`, `--index`, `--source`, `-s`, `--local`, and
environment variables such as `npm_config_registry`, `PIP_INDEX_URL`,
`UV_INDEX_URL`, `CARGO_REGISTRIES_*`, `GOPROXY`, and `GOPRIVATE`.

## Limitations

- Commands hidden inside `bash -c "..."`, scripts, Makefiles, or `npm run`
  scripts are not inspected.
- Registries configured in `.npmrc`, `pip.conf`, `uv.toml`, `.cargo/config.toml`,
  `composer.json`, or `NuGet.config` are not visible to the hook; the command is
  checked against the public registry. Use `allow` entries in `sloplock.yml` for
  private packages installed that way.
- `go get` of a package path inside a module is reduced to the module root on
  well-known hosts such as `github.com` and `golang.org`; on other hosts the
  full path is checked and may not resolve.
- Maven has no install command and is not covered.
- When a registry is unreachable the command is allowed through the normal
  permission flow. Use CI with `fail-closed: true` for a hard gate.
