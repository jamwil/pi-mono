# Publish fork runbook

Publishes only `@jamwil/pi-coding-agent`. Internal `@earendil-works/pi-*`
dependencies remain pinned to one upstream release version.

## Versions

Stable: bump the upstream patch and append `-jamwil.N`.

```text
upstream 0.84.1 -> 0.84.2-jamwil.0 -> 0.84.2-jamwil.1
```

Dev: bump the patch for each release, append `-dev.0`, and use the `dev`
dist-tag.

```text
0.84.2-dev.0 -> 0.84.3-dev.0
```

Tags match versions: `v0.84.2-jamwil.0`, `v0.84.2-dev.0`. Do not use
`jamwil-dev.N`.

## Stable release

Run from the repository root.

```bash
# Rebase onto the upstream release first.
VERSION=0.84.2-jamwil.0
npm version "$VERSION" -w packages/coding-agent --no-git-tag-version

# Confirm all @earendil-works/pi-* dependencies use the upstream version.
npm install --package-lock-only --ignore-scripts
npm run shrinkwrap:coding-agent
npm run install-lock:coding-agent
npm run check

# Runs prepublishOnly and builds dist/standalone/.
npm run publish:dry:coding-agent
```

### Smoke test

Set `NODE24` to the Node 24 executable shipped by `nodejs-wheel-binaries`. Set
provider credentials plus `PI_SMOKE_PROVIDER` and `PI_SMOKE_MODEL` for the
pi4py deployment, then run the smoke wrapper from the repository root:

```bash
export NODE24=/path/to/nodejs_wheel/bin/node
export PI_SMOKE_PROVIDER=openrouter
export PI_SMOKE_MODEL=openai/gpt-5.4
# Export the corresponding provider credential, such as OPENROUTER_API_KEY.

scripts/smoke-fork-release.sh
```

The script:

1. Packs the coding-agent workspace into a temporary tarball.
2. Installs that tarball outside the repository and checks `--help`, `--version`,
   and one real print-mode prompt.
3. Extracts only `dist/standalone`, matching pi4py packaging.
4. Verifies that the standalone directory has no `node_modules` and at most 30
   files.
5. Runs standalone `--help`, `--version`, and RPC `get_state` with `NODE24`.
6. Runs `scripts/smoke-standalone-rpc.py`, waits for `agent_settled`, and verifies
   that a real RPC prompt returns exactly `ok`.

Temporary files are removed on success or failure. A successful run ends with
`RELEASE_SMOKE=passed`.

### Publish

```bash
git add packages/coding-agent/package.json package-lock.json \
  packages/coding-agent/npm-shrinkwrap.json \
  packages/coding-agent/install-lock/package.json \
  packages/coding-agent/install-lock/package-lock.json
git commit -m "Release @jamwil/pi-coding-agent v$VERSION"

npm run publish:coding-agent
git tag "v$VERSION"
git push origin HEAD
git push origin "v$VERSION"
```

## Dev release

```bash
VERSION=0.84.2-dev.0
npm version "$VERSION" -w packages/coding-agent --no-git-tag-version
npm install --package-lock-only --ignore-scripts
npm run shrinkwrap:coding-agent
npm run install-lock:coding-agent
npm run check
npm run publish:dry:dev:coding-agent
```

Run the stable smoke test, then:

```bash
git add packages/coding-agent/package.json package-lock.json \
  packages/coding-agent/npm-shrinkwrap.json \
  packages/coding-agent/install-lock/package.json \
  packages/coding-agent/install-lock/package-lock.json
git commit -m "Dev @jamwil/pi-coding-agent v$VERSION"

npm run publish:dev:coding-agent
git push origin HEAD

# Optional
git tag "v$VERSION"
git push origin "v$VERSION"
```

After rebasing onto a new upstream release, bump both bases. For example,
upstream `0.84.2` starts with stable `0.84.3-jamwil.0` and dev
`0.84.3-dev.0`; subsequent dev releases continue bumping the patch.
