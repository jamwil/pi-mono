# Publish fork checklist

Publishes only `@jamwil/pi-coding-agent`. Upstream `@earendil-works/pi-*`
internal deps are normal npm dependencies, pinned in
`packages/coding-agent/package.json` at the upstream release version; they are
not republished from this fork.

## Versioning

Stable: bump upstream release's patch by one, add `-jamwil.N` suffix.

- `0.84.1` -> `0.84.2-jamwil.0` -> `0.84.2-jamwil.1` (same base)
- After rebase onto `0.84.2` -> `0.84.3-jamwil.0`

The patch bump keeps the fork above upstream (`0.84.2-jamwil.0` > `0.84.1`); a
prerelease suffix alone (`0.84.1-jamwil.0`) would sort below it.

Dev: same base, `-dev.N` suffix, published to the `dev` dist-tag. `dev` sorts
below `jamwil` lexically, so `latest` stays on the stable release.

- `0.84.2-dev.0` -> `0.84.2-dev.1`
- Do not use `jamwil-dev.N` (non-numeric id sorts above the release).

Tags match versions: `v0.84.2-jamwil.0`, `v0.84.2-dev.0`.

## Stable publish

```bash
# 1. Rebase onto the upstream release; coding-agent's internal deps should match it.

# 2. Set the fork version (only coding-agent; do NOT run npm run version:*)
npm version 0.84.2-jamwil.0 -w packages/coding-agent --no-git-tag-version

# 3. Verify pinned upstream internal deps in packages/coding-agent/package.json
#    (must share one version among themselves; need not match the fork version)

# 4. Refresh lockfiles
npm install --package-lock-only --ignore-scripts
npm run shrinkwrap:coding-agent
npm run install-lock:coding-agent

# 5. Checks
npm run check

# 6. Dry-run publish
npm run publish:dry:coding-agent

# 7. Smoke test the local tarball outside the monorepo
npm pack -w packages/coding-agent            # produces jamwil-pi-coding-agent-*.tgz
cd /tmp && npm install /path/to/jamwil-pi-coding-agent-*.tgz
npx pi --help
npx pi --version
npx pi -p "Say exactly: ok"

# 8. Commit release metadata
git add packages/coding-agent/package.json package-lock.json packages/coding-agent/npm-shrinkwrap.json packages/coding-agent/install-lock/package.json packages/coding-agent/install-lock/package-lock.json
git commit -m "Release @jamwil/pi-coding-agent v0.84.2-jamwil.0"

# 9. Publish
npm run publish:coding-agent

# 10. Tag and push
git tag v0.84.2-jamwil.0
git push origin HEAD
git push origin v0.84.2-jamwil.0
```

## Dev publish

Same flow with `dev` version, dev scripts, and the `dev` dist-tag. Usually
untagged.

```bash
npm version 0.84.2-dev.0 -w packages/coding-agent --no-git-tag-version
npm install --package-lock-only --ignore-scripts
npm run shrinkwrap:coding-agent
npm run install-lock:coding-agent
npm run check
npm run publish:dry:dev:coding-agent

npm pack -w packages/coding-agent
cd /tmp && npm install /path/to/jamwil-pi-coding-agent-*.tgz
npx pi --version

git add packages/coding-agent/package.json package-lock.json packages/coding-agent/npm-shrinkwrap.json packages/coding-agent/install-lock/package.json packages/coding-agent/install-lock/package-lock.json
git commit -m "Dev @jamwil/pi-coding-agent v0.84.2-dev.0"
npm run publish:dev:coding-agent

# Optional tag
git tag v0.84.2-dev.0
git push origin HEAD
git push origin v0.84.2-dev.0
```

When upstream releases the version you were deving toward (e.g. `0.84.2`), bump
both bases: stable `0.84.3-jamwil.0` to `latest`, dev `0.84.3-dev.N`.
