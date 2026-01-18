#!/bin/bash

# Verification script for iOS Dev MCP Server setup
echo "🔍 iOS Dev MCP Server - Setup Verification"
echo "==========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PASS="\033[0;32m✅\033[0m"
FAIL="\033[0;31m❌\033[0m"
WARN="\033[0;33m⚠️\033[0m"

# Check macOS
echo -n "Platform check (macOS): "
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "$PASS"
else
    echo -e "$FAIL (requires macOS)"
    exit 1
fi

# Check Node.js
echo -n "Node.js installed: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "$PASS ($NODE_VERSION)"
else
    echo -e "$FAIL"
    exit 1
fi

# Check Node version
echo -n "Node.js version >= 18: "
NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -ge 18 ]; then
    echo -e "$PASS"
else
    echo -e "$FAIL (version $NODE_MAJOR < 18)"
    exit 1
fi

# Check Xcode
echo -n "Xcode Command Line Tools: "
if command -v xcrun &> /dev/null; then
    echo -e "$PASS"
else
    echo -e "$FAIL"
    echo "Install with: xcode-select --install"
    exit 1
fi

# Check simctl
echo -n "simctl available: "
if xcrun simctl list &> /dev/null; then
    echo -e "$PASS"
else
    echo -e "$FAIL"
    exit 1
fi

# Check project build
echo -n "Project built: "
if [ -d "$SCRIPT_DIR/build" ] && [ -f "$SCRIPT_DIR/build/index.js" ]; then
    echo -e "$PASS"
else
    echo -e "$FAIL"
    echo "Run: npm run build"
    exit 1
fi

# Check dependencies
echo -n "Dependencies installed: "
if [ -d "$SCRIPT_DIR/node_modules" ]; then
    echo -e "$PASS"
else
    echo -e "$FAIL"
    echo "Run: npm install"
    exit 1
fi

# Check Claude Code settings
echo -n "Claude Code configuration: "
SETTINGS_FILE="$HOME/.config/claude-code/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    if grep -q "ios-dev" "$SETTINGS_FILE"; then
        echo -e "$PASS"
    else
        echo -e "$WARN (ios-dev not found in settings)"
        echo "Run: ./install-claude-code.sh"
    fi
else
    echo -e "$WARN (settings file not found)"
    echo "Run: ./install-claude-code.sh"
fi

# Test MCP server startup
echo -n "MCP server can start: "
if timeout 3s node "$SCRIPT_DIR/build/index.js" < /dev/null > /dev/null 2>&1; then
    # If it runs for 3 seconds without crashing, that's good
    echo -e "$PASS"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        # Timeout is expected - server runs indefinitely
        echo -e "$PASS"
    else
        echo -e "$FAIL (exit code: $EXIT_CODE)"
        echo "Try: node $SCRIPT_DIR/build/index.js"
    fi
fi

# Check for iOS simulators
echo -n "iOS simulators available: "
SIMULATOR_COUNT=$(xcrun simctl list devices -j | grep -c "\"udid\"" || echo "0")
if [ "$SIMULATOR_COUNT" -gt 0 ]; then
    echo -e "$PASS ($SIMULATOR_COUNT devices)"
else
    echo -e "$WARN (no simulators found)"
    echo "Open Xcode or Simulator.app to download simulators"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\033[0;32m✨ Setup verification complete!\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Ready to use with Claude Code!"
echo ""
echo "Try these prompts in Claude Code:"
echo "  • List all iOS simulators"
echo "  • Boot an iPhone 15 Pro simulator"
echo "  • Get info about the booted simulator"
echo ""
echo "📖 Documentation:"
echo "  • README: $SCRIPT_DIR/README.md"
echo "  • Setup Guide: $SCRIPT_DIR/CLAUDE_CODE_SETUP.md"
echo ""
