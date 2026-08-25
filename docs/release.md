# Release And Marketplace Checklist

SlopLock is promoted as a GitHub Action first. The npm package exists so the
Action and local CLI can share one implementation, but the public release path
should optimize for `theinfosecguy/sloplock@v2`.

## Before Tagging

1. Confirm `main` is up to date and all required checks are green.
2. Confirm any source PR that touched `src/action`, `src/core`, parsers,
   registries, or reporting has a follow-up generated-artifact refresh PR merged.
3. Run the release validation stack from a clean `main` checkout:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   npm run check:dist-current
   claude plugin validate . --strict
   npm run smoke:ecosystems
   npm run pack:dry-run
   npm run smoke:package
   npm audit --audit-level=low
   git diff --check
   test -z "$(find . -maxdepth 1 -name '*.tgz' -print)"
   ```

4. Verify `package.json`, `package-lock.json`, `src/core/version.ts`, and
   `.claude-plugin/plugin.json` use the release version. If the marketplace
   entry declares a version, verify that it matches too.

## Tagging

Create an immutable version tag and update the moving major tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

git tag -fa vX vX.Y.Z -m "Move vX to vX.Y.Z"
git push origin refs/tags/vX --force
```

Replace `vX` with the matching moving major tag, such as `v2` for a `v2.0.0`
release. Use the immutable version tag for exact pinning and the moving major
tag for normal Action installation. Do not move an older major tag to a newer
major release.

## GitHub Release And Marketplace

GitHub Marketplace publishing for an Action is driven from the release flow and
the root `action.yml` metadata file.

1. Open `action.yml` in GitHub and use the Marketplace banner to draft a release,
   or create a GitHub release for the version tag and select the option to publish the
   Action to GitHub Marketplace.
2. Use the matching file under `docs/releases/` as the release notes.
3. Confirm the Marketplace listing shows:
   - action name: `SlopLock`
   - install ref: `theinfosecguy/sloplock@v2`
   - category/tags related to security and dependency review
4. After publication, verify the install snippet in the Marketplace listing still
   uses a full checkout with `fetch-depth: 0`.
5. Confirm the GitHub Releases page shows the new immutable version tag as the
   latest release. If npm publish has already succeeded and the release workflow
   only failed because the package version already exists, create or update the
   GitHub release from the matching `docs/releases/` notes without republishing
   npm.

## Plugin Marketplace

For releases that change the bundled install hook:

1. Confirm `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`,
   `hooks/hooks.json`, and `dist/hook/index.cjs` are present on the release tag.
2. Run `claude plugin validate . --strict` from the repository root.
3. Add the marketplace and install the plugin from a clean temporary
   configuration:

   ```text
   /plugin marketplace add theinfosecguy/sloplock
   /plugin install sloplock@sloplock
   ```

4. Confirm an ordinary shell command is unaffected, a known public package is
   checked, and a deliberately nonexistent package is denied before execution.
5. Confirm the README and `docs/hook.md` installation commands match the
   marketplace and plugin names.

Official references:

- GitHub Action metadata syntax: <https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax>
- Publishing Actions in GitHub Marketplace: <https://docs.github.com/actions/creating-actions/publishing-actions-in-github-marketplace>
