# Publish fork checklist

This fork publishes only `@jamwil/pi-coding-agent`.

## Versioning scheme

Use the upstream release as the base version and add a fork prerelease suffix.

Examples:

- first fork release from upstream `0.76.0` -> `0.76.0-jamwil.0`
- next fork-only release on the same upstream base -> `0.76.0-jamwil.1`
- if you want a fork-only release that is clearly newer than the upstream `0.76.0` line, bump patch and publish `0.76.1-jamwil.0`
- after rebasing onto upstream `0.76.1` -> `0.76.1-jamwil.0`

Use matching version tags:

- `v0.76.0-jamwil.0`
- `v0.76.0-jamwil.1`
- `v0.76.1-jamwil.0`

Because these are prerelease versions, npm publish must use an explicit dist-tag.
This fork uses `--tag jamwil`.

## 1. Rebase onto the upstream release you want to fork

Update the fork branch so it is based on the upstream release you want to
publish from.

## 2. Set the fork package version

Example for the first fork release from upstream `0.76.0`:

```bash
npm version 0.76.0-jamwil.0 -w packages/coding-agent --no-git-tag-version
```

Example for the next fork-only release on the same upstream base:

```bash
npm version 0.76.0-jamwil.1 -w packages/coding-agent --no-git-tag-version
```

Example for a fork-only release that bumps patch beyond upstream `0.76.0`:

```bash
npm version 0.76.1-jamwil.0 -w packages/coding-agent --no-git-tag-version
```

Example after rebasing onto upstream `0.76.1`:

```bash
npm version 0.76.1-jamwil.0 -w packages/coding-agent --no-git-tag-version
```

## 3. Verify pinned upstream internal package versions

Check `packages/coding-agent/package.json`:

```json
{
  "@earendil-works/pi-agent-core": "0.76.0",
  "@earendil-works/pi-ai": "0.76.0",
  "@earendil-works/pi-tui": "0.76.0"
}
```

These should match the upstream release you rebased onto.

## 4. Refresh lockfiles

```bash
npm install --package-lock-only --ignore-scripts
npm run shrinkwrap:coding-agent
```

## 5. Run checks

```bash
npm run check
```

## 6. Run a dry-run publish

```bash
npm run publish:dry:coding-agent
```

## 7. Smoke test outside the monorepo

```bash
npm pack ./packages/coding-agent
npm install ./jamwil-pi-coding-agent-*.tgz
npx pi --help
npx pi --version
```

Optional stronger smoke test:

```bash
npx pi -p "Say exactly: ok"
```

## 8. Commit the release metadata

Stage only the release files:

```bash
git add packages/coding-agent/package.json package-lock.json packages/coding-agent/npm-shrinkwrap.json
```

Commit example:

```bash
git commit -m "Release @jamwil/pi-coding-agent v0.76.1-jamwil.0"
```

## 9. Publish

```bash
npm run publish:coding-agent
```

## 10. Tag the release

Create a tag that matches the published version:

```bash
git tag v0.76.1-jamwil.0
```

Push commit and tag:

```bash
git push origin HEAD
git push origin v0.76.1-jamwil.0
```

## Commands used for this fork

```bash
npm run publish:dry:coding-agent
npm run publish:coding-agent
```
