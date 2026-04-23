# Fork release process

This fork publishes patched packages from the `patched` branch. Do not use the
removed upstream all-workspace release flow.

If you want the slow, no-assumptions walkthrough, see
[Fork release step by step](./fork-release-step-by-step.md).

## 1. Default strategy: publish all four workspaces in lockstep

Recommended default for this fork: treat the four published packages as one
release train.

Publish all four workspaces together on the same version:

1. `packages/ai`
2. `packages/tui`
3. `packages/agent`
4. `packages/coding-agent`

That means:

- all four selected workspaces share the same version
- fork-owned inter-package dependency references also use that same version
- the release commands stay the same every time

Default workspace set:

```bash
packages/ai,packages/tui,packages/agent,packages/coding-agent
```

This is not the smallest possible publish set, but it is the simplest
operational model.

### Optional optimization: smallest publishable workspace set

If you want to publish only the changed dependency closure instead, use this
matrix:

| Changed workspace(s)         | Publish this set                                         |
| ---------------------------- | -------------------------------------------------------- |
| `packages/coding-agent` only | `packages/coding-agent`                                  |
| `packages/tui`               | `packages/tui`, `packages/coding-agent`                  |
| `packages/agent`             | `packages/agent`, `packages/coding-agent`                |
| `packages/ai`                | `packages/ai`, `packages/agent`, `packages/coding-agent` |

## 2. Set the fork version intentionally

Use upstream-based prerelease versions such as `0.66.1-jamwil.0`.

Under the recommended lockstep strategy, all four published workspaces stay on
the same exact version every release, even if some packages had no code changes.

Update fork-owned inter-package dependency references at the same time:

- `packages/agent` -> `@jamwil/pi-ai`
- `packages/coding-agent` -> `@jamwil/pi-ai`
- `packages/coding-agent` -> `@jamwil/pi-agent-core`
- `packages/coding-agent` -> `@jamwil/pi-tui`

## 3. Validate before publishing

Run the repository checks first:

```bash
npm run check
```

Preview the exact publish order and suggested fork tag:

```bash
npm run fork:release:plan -- --workspaces packages/ai,packages/tui,packages/agent,packages/coding-agent
```

Dry-run the default lockstep release:

```bash
npm run fork:release:dry -- --workspaces packages/ai,packages/tui,packages/agent,packages/coding-agent --dist-tag latest
```

Optional smaller-set examples:

```bash
npm run fork:release:dry -- --workspaces packages/coding-agent --dist-tag latest
npm run fork:release:dry -- --workspaces packages/tui,packages/coding-agent --dist-tag latest
npm run fork:release:dry -- --workspaces packages/ai,packages/agent,packages/coding-agent --dist-tag latest
```

The helper script never stages, commits, tags, or pushes git changes.

## 4. Stage and push safely

Do not use `git add .` in this repository.

Stage only the release files you intentionally changed, commit them, and push
the current branch to `patched` explicitly:

```bash
git status
git add <path> [<path> ...]
git commit -m "chore(release): prepare <version>"
git push origin HEAD:patched
```

## 5. Publish from `patched`

After the dry run passes and the release commit is on `patched`, publish the
default lockstep release:

```bash
npm run fork:release:publish -- --workspaces packages/ai,packages/tui,packages/agent,packages/coding-agent --dist-tag latest
```

If you intentionally chose a smaller release set, publish that exact set
instead.

## 6. Record the fork release with a namespaced tag

Do not create bare upstream-style tags such as `v0.66.1`.

Use fork tags instead:

```bash
VERSION=0.66.1-jamwil.0
git tag "fork/pi/v${VERSION}"
git push origin "fork/pi/v${VERSION}"
```
