# Pi Monorepo

Personal publishing fork of Mario Zechner's [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

This fork tracks upstream and publishes patched npm builds under the `@jamwil/*` scope. The main CLI package is `@jamwil/pi`:

```bash
npm install -g @jamwil/pi
```

Runtime identity is unchanged:
- binary: `pi`
- config directory: `~/.pi/agent`

For the main project, issue tracker, and contribution flow, use the upstream repository. PRs are not accepted in this fork at this time.

> Looking for the pi coding agent? See [packages/coding-agent](packages/coding-agent) for installation and usage.

## Packages

| Package | Description |
|---------|-------------|
| **[@jamwil/pi-ai](packages/ai)** | Unified multi-provider LLM API (OpenAI, Anthropic, Google, etc.) |
| **[@jamwil/pi-agent-core](packages/agent)** | Agent runtime with tool calling and state management |
| **[@jamwil/pi](packages/coding-agent)** | Interactive coding agent CLI |
| **[@jamwil/pi-tui](packages/tui)** | Terminal UI library with differential rendering |

## Contributing

This fork is for personal patched releases. If you want to contribute to pi itself, please open issues or PRs upstream at [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

## Development

```bash
npm install          # Install all dependencies
npm run build        # Build all packages
npm run check        # Lint, format, and type check
./test.sh            # Run tests (skips LLM-dependent tests without API keys)
./pi-test.sh         # Run pi from sources (can be run from any directory)
```

## License

MIT
