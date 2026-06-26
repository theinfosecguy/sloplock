# SlopLock

SlopLock blocks nonexistent and too-new npm and PyPI packages before they enter your repo.

```bash
npx sloplock .
```

V1 is intentionally narrow: npm package names in `package.json` and npm lockfiles, plus PyPI package names in `requirements*.txt`, `*-requirements.txt`, `constraints*.txt`, `*-constraints.txt`, and `pyproject.toml`, checked for package existence and first-published cooldown.

## GitHub Action

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
      - uses: theinfosecguy/sloplock@v1
        with:
          ecosystem: all
          fail-on: high
          changed-only: true
          comment: true
```

## What It Checks

- `package_not_found`: the package name does not exist on npm or PyPI.
- `package_too_new`: the package exists but was first published inside the configured cooldown period.

SlopLock is not an SCA scanner, vulnerability scanner, typosquat detector, or package reputation score.
