# Release And Marketplace Checklist

SlopLock is promoted as a GitHub Action first. The npm package exists so the
Action and local CLI can share one implementation, but the public release path
should optimize for `theinfosecguy/sloplock@v1`.

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
   npm run smoke:ecosystems
   npm run pack:dry-run
   npm run smoke:package
   npm audit --audit-level=low
   git diff --check
   test -z "$(find . -maxdepth 1 -name '*.tgz' -print)"
   ```

4. Verify `package.json` and `package-lock.json` use the release version.

## Tagging

Create an immutable version tag and update the moving major tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

git tag -fa v1 vX.Y.Z -m "Move v1 to vX.Y.Z"
git push origin refs/tags/v1 --force
```

Use the immutable version tag for exact pinning and `v1` for normal Action
installation.

## GitHub Release And Marketplace

GitHub Marketplace publishing for an Action is driven from the release flow and
the root `action.yml` metadata file.

1. Open `action.yml` in GitHub and use the Marketplace banner to draft a release,
   or create a GitHub release for the version tag and select the option to publish the
   Action to GitHub Marketplace.
2. Use the matching file under `docs/releases/` as the release notes.
3. Confirm the Marketplace listing shows:
   - action name: `SlopLock`
   - install ref: `theinfosecguy/sloplock@v1`
   - category/tags related to security and dependency review
4. After publication, verify the install snippet in the Marketplace listing still
   uses a full checkout with `fetch-depth: 0`.
5. Confirm the GitHub Releases page shows the new immutable version tag as the
   latest release. If npm publish has already succeeded and the release workflow
   only failed because the package version already exists, create or update the
   GitHub release from the matching `docs/releases/` notes without republishing
   npm.

Official references:

- GitHub Action metadata syntax: <https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax>
- Publishing Actions in GitHub Marketplace: <https://docs.github.com/actions/creating-actions/publishing-actions-in-github-marketplace>
