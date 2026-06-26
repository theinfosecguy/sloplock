# Repository Scripts

Keep `package.json` scripts as the stable command surface for contributors and
CI. Put implementation details here when a command needs more than a short
tool invocation.

- `ci/`: repository policy and generated-artifact checks used by GitHub Actions.
- `smoke/`: end-to-end smoke checks that exercise the built CLI, package, or
  bundled Action.

Prefer plain Node `.mjs` scripts that run on the repo's supported Node version.
Avoid adding a task runner until there is repeated orchestration logic that
cannot stay clear in npm scripts plus small helpers.
