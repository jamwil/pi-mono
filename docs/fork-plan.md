# Fork patch completion plan

## Goals

- Publish the patched pi coding agent to npm for personal use.
- Keep the fork as close to upstream as possible so future cherry-picks stay
  small.
- Remove or adapt repo/package metadata that only makes sense for the upstream
  maintainer.
- Avoid leaving technical debt in the form of dead GitHub workflows, misleading
  README sections, or release tooling that cannot safely be used on the fork.

## Current repo facts

- `origin` points at `https://github.com/jamwil/pi-mono.git`.
- The remote default branch is currently `patched`.
- The published workspace packages are currently at `0.66.1`.
- The root release tooling assumes upstream conventions:
  - publishes all workspaces
  - stages everything
  - pushes `origin main`
  - creates bare `v*` tags
- `README.md` and `packages/coding-agent/README.md` both contain upstream-only
  community/OSS-weekend material.
- Several GitHub workflows are clearly upstream-maintainer policy automation
  rather than fork-appropriate CI.

## Guiding principles

1. Prefer the smallest possible publish surface.
2. Keep product identity (`pi`, `.pi`, `pi` binary) unless there is a concrete
   reason to rebrand.
3. Rename npm package names only where publication requires it.
4. Add fork-specific release tooling instead of mutating upstream release
   tooling into something half-upstream/half-fork.
5. Remove automations and README sections that are not true for this fork.

## Decisions captured from review

- The published fork should be self-contained and should not depend on upstream
  npm packages at runtime.
- The primary published CLI package should be `@jamwil/pi`.
- Keep runtime identity unchanged: the binary remains `pi` and the config dir
  remains `.pi`.
- Prefer direct fork package names over upstream-specifier compatibility shims
  where a choice must be made.
- This repo is a personal publishing fork. Do not invite PRs here; credit Mario
  Zechner and direct users upstream for the main project.
- Remove references to upstream-hosted services rather than documenting them as
  dependencies of the fork.
- Keep only GitHub automation that is needed for publishing the fork on npm
  from the `patched` branch. Everything else should be removed.
- Use upstream-based prerelease versioning such as `0.66.1-jamwil.0`.
- Publish the scoped fork package on the `latest` dist-tag.
- Keep documentation edits narrowly scoped; do not do a broad branding scrub.

---

## 1. Identify the minimum set of packages that must be published

Before touching package names or release tooling, determine which workspaces
actually changed relative to upstream.

Suggested setup:

```bash
git remote add upstream https://github.com/badlogic/pi-mono.git   # if missing
git fetch upstream --tags
git diff --name-only upstream/main...HEAD
```

Use the smallest publishable closure of the dependency graph:

| Changed workspace(s)         | Publish this set                                         | Notes                                                            |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `packages/coding-agent` only | `packages/coding-agent`                                  | Best case. Lowest churn.                                         |
| `packages/tui`               | `packages/tui`, `packages/coding-agent`                  | coding-agent imports tui directly.                               |
| `packages/agent`             | `packages/agent`, `packages/coding-agent`                | coding-agent depends on agent-core.                              |
| `packages/ai`                | `packages/ai`, `packages/agent`, `packages/coding-agent` | ai is shared by agent-core and coding-agent; keep these aligned. |

Important: avoid mixing forked and upstream runtime packages in the published
install. The fork should be self-contained.

That means the minimum publish set is still the smallest changed workspace
closure relative to upstream, but every published dependency in that closure
must resolve to fork-owned packages rather than upstream npm packages.

If the patch is truly coding-agent-only, verify whether `@jamwil/pi` can remain
self-contained without republishing additional workspaces. If not, publish the
necessary dependency closure under the fork as well.

---

## 2. Package naming and metadata strategy

### Preferred strategy

- Keep the app/runtime identity as-is:
  - `piConfig.name = "pi"`
  - `piConfig.configDir = ".pi"`
  - CLI binary name stays `pi`
- Rename only the npm package names that must be published to your own scope.

Examples:

- primary CLI package: `@mariozechner/pi-coding-agent` -> `@jamwil/pi`
- additional fork-owned internal workspaces, if needed for self-containment,
  should use the `@jamwil/*` scope

This keeps the runtime drop-in compatible while satisfying npm ownership
constraints.

### When to rebrand more aggressively

Only rename the CLI binary, app name, config dir, or environment variable
namespace if you explicitly want side-by-side installs with upstream. That is a
separate decision and a larger divergence from upstream.

### Package metadata that should be updated for published forked packages

For every package you actually publish:

- `name`
- `repository.url`
- `repository.directory` if still applicable
- optionally `bugs`
- optionally `homepage`
- npm badge/install strings in the package README

For workspaces you are not publishing, leave the package metadata alone.

### Internal dependency strategy

Because the published fork should be self-contained, do not leave published fork
packages depending on upstream npm packages.

If multiple workspaces must be fork-published, prefer renaming inter-package
runtime dependencies to fork-owned package names rather than using upstream
specifier aliases. That is a somewhat larger diff, but it avoids presenting the
published fork as if it were still composed of upstream packages.

If aliasing becomes necessary in a narrow case to keep the fork installable,
call that out explicitly as an exception rather than the default strategy.

---

## 3. Fix package self-imports and user-facing import examples

If `packages/coding-agent` is published under a new npm name, there is one
critical runtime compatibility issue to handle: the extension loader currently
hardcodes `@mariozechner/pi-coding-agent` as the self-import specifier.

### Required code work

Update `packages/coding-agent/src/core/extensions/loader.ts` so the loader
exposes the fork package name.

That applies to both:

- `VIRTUAL_MODULES`
- `getAliases()`

Best minimal approach:

- derive the actual package name from `package.json`
- register the fork package name as the canonical self-import target

That lets locally loaded extensions work with imports like:

```ts
import type { ExtensionAPI } from "@jamwil/pi";
```

Do not preserve upstream package-name compatibility unless it turns out to be
required to keep the fork installable or internally consistent.

### User-facing import examples that must be reviewed if the package name changes

Search for:

```bash
rg -n "@mariozechner/pi-coding-agent" packages/coding-agent
```

At minimum review:

- `packages/coding-agent/README.md`
- `packages/coding-agent/examples/**`
- `packages/coding-agent/examples/README.md`
- SDK snippets
- extension snippets
- any copy-paste code examples in docs

Do not bother mass-rewriting internal source comments unless they are actually
user-facing or copy-pasteable.

---

## 4. README and docs cleanup

The goal is not to rewrite upstream product docs. The goal is to remove sections
that are false or irrelevant for this fork.

### Root `README.md`

Remove or replace:

- OSS weekend banner
- Discord/community badge if you are not using it
- upstream CI badge
- donated domain block
- "share your OSS coding agent sessions" section if you do not intend to run
  that campaign from this fork
- contribution process text that depends on upstream-only workflows

Replace with a short fork note covering:

- this repo tracks upstream `badlogic/pi-mono`
- the fork exists to publish a personal patched npm build
- where to install the forked package from
- that PRs are not accepted here at this time
- credit to Mario Zechner and a pointer upstream for the main project

### `packages/coding-agent/README.md`

Remove or replace:

- OSS weekend banner
- Discord badge
- upstream npm badge
- upstream CI badge
- donated domain block
- upstream-specific community/support language that is not true for the fork

Update:

- install command
- package name in code snippets
- repo links/badges
- any visible package metadata references

### Deeper docs

Most deep docs can remain upstream-style if they are still accurate, but review
user-facing links that would be misleading for a forked npm package.

Low-priority but worth auditing:

- direct links to `github.com/badlogic/pi-mono`
- links to hosted assets/services you do not control
- schema URLs that point to upstream raw GitHub paths

### Hosted defaults audit

Review runtime/user-facing defaults that point to upstream-hosted services. The
most obvious current one is:

- `PI_SHARE_VIEWER_URL` defaulting to `https://pi.dev/session/`

Decision:

- remove or replace upstream-hosted service defaults and references rather than
  documenting the fork as depending on them

---

## 5. Remove or adapt non-applicable GitHub automation

### Keep only if needed for npm fork publishing

- retain only workflows that are actually needed to publish the fork from the
  `patched` branch

### Branch assumptions

The active branch remains `patched` for now.

Any retained workflow must target `patched` rather than `main`.

Do not leave automation configured for a branch that this fork does not use.

### Remove or disable unless you truly want them

These are upstream-maintainer policy workflows, not generic fork CI:

- `.github/workflows/approve-contributor.yml`
- `.github/workflows/pr-gate.yml`
- `.github/workflows/oss-weekend-issues.yml`
- `.github/workflows/openclaw-gate.yml`

Related files that should usually be removed at the same time:

- `.github/APPROVED_CONTRIBUTORS`
- `.github/APPROVED_CONTRIBUTORS.vacation`
- `.github/oss-weekend.json`
- `.github/ISSUE_TEMPLATE/contribution.yml`
- Discord contact link in `.github/ISSUE_TEMPLATE/config.yml`

### `build-binaries.yml`

Keep this workflow only if you actually intend to ship GitHub release binaries
from the fork.

If kept, update:

- tag naming convention
- repo/release assumptions
- any branch assumptions
- changelog/release note expectations

If not kept, delete it instead of letting it become dead release theater.

---

## 6. Release tooling: do not use the upstream scripts unchanged

The current root release flow is not safe for the fork as-is.

### Why the current root release scripts are wrong for the fork

- `npm publish -ws` publishes all workspaces
- `scripts/release.mjs` stages everything with `git add .`
- `scripts/release.mjs` assumes `origin main`
- tags are bare `v*`, which looks like an upstream release stream
- the script is designed for the upstream lockstep release process, not a
  selective personal fork publish

### Recommended fork release approach

Add a separate fork-specific release path instead of mutating the upstream one.

Default to a documented manual release flow first. Add a fork-only script later
only if publishing becomes frequent enough to justify it.

### Manual flow checklist

1. Determine the exact workspace set to publish.
2. Bump versions only for that set.
3. Update package names/metadata/README text for those packages.
4. Run repo checks:
   ```bash
   npm run check
   ```
5. Dry-run each publishable workspace:
   ```bash
   cd packages/coding-agent && npm publish --dry-run
   ```
   or equivalent per workspace.
6. Publish in dependency order.
7. Install the published package from npm into a clean environment and smoke
   test it.

### Publish order when multiple workspaces are forked

Use dependency order:

1. `packages/ai`
2. `packages/tui`
3. `packages/agent`
4. `packages/coding-agent`

If only `packages/coding-agent` is forked, publish only that workspace.

### Smoke tests after publish

At minimum verify:

- package installs globally
- `pi --version` works
- `pi --help` works
- one real session starts
- a trivial extension can import the forked package name

The extension import smoke test is especially important because the
self-aliasing work in the extension loader is easy to miss.

---

## 7. Semver guidance for a personal fork

This fork should communicate two things at once:

1. which upstream release it is based on
2. how many fork-only deltas sit on top of that release

### Recommended version format

Use the upstream version as the base and append a fork prerelease identifier.

Examples:

- first fork release based on upstream `0.66.1`:
  - `0.66.1-jamwil.0`
- second fork-only release on the same upstream base:
  - `0.66.1-jamwil.1`
- after rebasing onto upstream `0.66.2`:
  - `0.66.2-jamwil.0`

Why this is better than inventing `0.66.2` immediately:

- it preserves clear ancestry
- it avoids pretending the fork is the canonical next upstream patch
- it makes rebases and comparisons obvious

### Dist-tags

For personal use, do not rush to publish the fork to npm `latest`.

Prefer one of these initially:

- `--tag jamwil`
- `--tag fork`

Promote to `latest` only if you want a bare install of your scoped package to
resolve to the fork automatically.

### Exact version pinning

Because this is primarily for personal use, pin exact versions in shell scripts,
devcontainers, dotfiles, or bootstrap scripts.

Do not depend on loose ranges to find the right fork build.

### Multiple forked workspaces

If more than one workspace is published from the fork:

- keep them on the exact same prerelease version
- treat them as a lockstep forked set

Example:

- `@jamwil/pi-ai@0.66.1-jamwil.0`
- `@jamwil/pi-agent-core@0.66.1-jamwil.0`
- `@jamwil/pi@0.66.1-jamwil.0`

### Prerelease range caveat

Normal semver ranges do not treat prereleases like normal releases.

In practice that means:

- `^0.66.1` will **not** pick up `0.66.1-jamwil.0`
- prerelease-aware dependencies need either:
  - exact versions, or
  - ranges that explicitly mention the prerelease base

For a forked multi-package set, exact internal dependency versions are the
safest option if prerelease behavior becomes confusing.

### Breaking changes

If the fork remains a drop-in replacement and only adds fixes/personal
adjustments:

- keep the upstream base version
- increment only the fork prerelease counter

If the fork intentionally breaks its own public API or CLI behavior:

- bump the minor portion before resetting the fork prerelease counter
- continue following the repo convention of no major releases

### Git tag naming

Do not use bare upstream-looking tags such as:

- `v0.66.1`

Prefer namespaced fork tags such as:

- `fork/pi/v0.66.1-jamwil.0`
- `jamwil-pi-v0.66.1-jamwil.0`

That avoids ambiguity with upstream release history and makes automation safer.

### Private root version

The root package is private and currently not aligned with the workspace release
numbers. Ignore the root version for fork npm semver decisions; version the
published workspaces, not the monorepo shell.

---

## 8. Suggested execution order

1. Add/fetch `upstream` remote and record the upstream base commit/tag.
2. Determine the minimum workspace publish set.
3. Set the first fork version to `0.66.1-jamwil.0` unless the upstream base has
   already changed by the time the work is done.
4. Rename the primary published package to `@jamwil/pi` and update package
   metadata for any additional published fork workspaces.
5. Ensure the published dependency set is self-contained and does not pull in
   upstream npm packages at runtime.
6. Fix coding-agent self-import aliasing for the fork package name.
7. Update user-facing import examples that mention the published package name.
8. Remove or adapt non-applicable GitHub workflows and issue templates,
   retaining only what is needed to publish from `patched`.
9. Trim root and coding-agent READMEs so they describe the fork truthfully,
   credit Mario Zechner, and direct users upstream.
10. Remove or replace references to upstream-hosted services.
11. Decide whether `build-binaries.yml` is real or dead; keep or delete
    accordingly.
12. Run `npm run check`.
13. Do per-workspace `npm publish --dry-run` checks.
14. Publish in dependency order using the `latest` dist-tag.
15. Install from npm and run post-publish smoke tests.
16. Record the release with a fork-specific tag.

---

## 9. Definition of done

The patch is complete when all of the following are true:

- the minimum necessary workspace set is published under your npm scope
- the forked package can be installed and run successfully from npm
- extension imports work with the forked package name
- root and package READMEs no longer advertise upstream-only
  policies/services/community material as if they applied here
- non-applicable GitHub workflows and issue templates are removed or updated
- the release process no longer depends on the upstream all-workspace release
  script
- the versioning scheme clearly communicates both upstream base and fork delta

---

