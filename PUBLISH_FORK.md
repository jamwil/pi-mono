# Publish fork runbook

Publishes only `@jamwil/pi-coding-agent`. Internal `@earendil-works/pi-*`
dependencies remain pinned to one upstream release version.

## Versions

Stable: bump the upstream patch and append `-jamwil.N`.

```text
upstream 0.84.1 -> 0.84.2-jamwil.0 -> 0.84.2-jamwil.1
```

Dev: use the same base with `-dev.N` and the `dev` dist-tag.

```text
0.84.2-dev.0 -> 0.84.2-dev.1
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
pi4py deployment.

```bash
: "${NODE24:?Set NODE24 to the nodejs-wheel-binaries Node 24 executable}"
: "${PI_SMOKE_PROVIDER:?Set PI_SMOKE_PROVIDER}"
: "${PI_SMOKE_MODEL:?Set PI_SMOKE_MODEL}"

PACK_DIR=$(mktemp -d)
TARBALL="$PACK_DIR/$(npm pack -w packages/coding-agent --pack-destination "$PACK_DIR" --silent)"

# Normal npm package.
NPM_SMOKE_DIR=$(mktemp -d)
(
  cd "$NPM_SMOKE_DIR"
  npm install "$TARBALL"
  npx pi --help
  npx pi --version
  npx pi --provider "$PI_SMOKE_PROVIDER" --model "$PI_SMOKE_MODEL" -p "Say exactly: ok"
)

# Standalone files extracted exactly as pi4py will consume them.
UNPACK_DIR=$(mktemp -d)
STANDALONE_DIR=$(mktemp -d)
tar -xzf "$TARBALL" -C "$UNPACK_DIR"
cp -R "$UNPACK_DIR/package/dist/standalone/." "$STANDALONE_DIR/"
(
  cd "$STANDALONE_DIR"
  test ! -d node_modules
  test "$(find . -type f | wc -l | tr -d ' ')" -le 30
  HOME="$STANDALONE_DIR/home" "$NODE24" ./cli.mjs --help
  HOME="$STANDALONE_DIR/home" "$NODE24" ./cli.mjs --version
  printf '%s\n' '{"id":"smoke","type":"get_state"}' | \
    HOME="$STANDALONE_DIR/home" "$NODE24" ./cli.mjs --mode rpc --no-session \
      --provider "$PI_SMOKE_PROVIDER" --model "$PI_SMOKE_MODEL"
)
```

Use the pi4py RPC client with `STANDALONE_DIR` for one real prompt. Wait for
`agent_settled` and verify the response.

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
upstream `0.84.2` uses stable `0.84.3-jamwil.0` and dev `0.84.3-dev.N`.
