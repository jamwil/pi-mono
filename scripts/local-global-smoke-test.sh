#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/jamwil/projects/pi-mono"
VERSION="0.66.1-jamwil.0"

AI_DIR="$ROOT/packages/ai"
TUI_DIR="$ROOT/packages/tui"
AGENT_DIR="$ROOT/packages/agent"
CLI_DIR="$ROOT/packages/coding-agent"

AI_TGZ="$AI_DIR/jamwil-pi-ai-$VERSION.tgz"
TUI_TGZ="$TUI_DIR/jamwil-pi-tui-$VERSION.tgz"
AGENT_TGZ="$AGENT_DIR/jamwil-pi-agent-core-$VERSION.tgz"
CLI_TGZ="$CLI_DIR/jamwil-pi-$VERSION.tgz"

pack_workspace() {
  local dir="$1"
  echo "Packing $dir"
  (
    cd "$dir"
    rm -f ./*.tgz
    npm pack
  )
}

echo "Packing local tarballs"
pack_workspace "$AI_DIR"
pack_workspace "$TUI_DIR"
pack_workspace "$AGENT_DIR"
pack_workspace "$CLI_DIR"

echo "Removing previous global installs"
npm uninstall -g @jamwil/pi @jamwil/pi-ai @jamwil/pi-agent-core @jamwil/pi-tui || true

echo "Installing global tarballs"
npm install -g \
  "$AI_TGZ" \
  "$TUI_TGZ" \
  "$AGENT_TGZ" \
  "$CLI_TGZ"

echo
echo "Installed packages:"
npm ls -g --depth=0 | rg '@jamwil/pi|@jamwil/pi-ai|@jamwil/pi-agent-core|@jamwil/pi-tui' || true

echo
echo "pi binary:"
which pi

echo
echo "pi --version"
pi --version

echo
echo "pi --help"
pi --help

echo
echo "Smoke install complete. Run 'pi' manually to start a real session."
