# iOS Development MCP Server

A comprehensive Model Context Protocol (MCP) server providing iOS simulator control and Swift/Xcode development tools for Claude AI.

> **⚠️ DEVELOPMENT STATUS WARNING**
>
> This project is under active development and should be considered **ALPHA quality**.
>
> - **Bugs and Issues:** Expect bugs, incomplete features, and breaking changes
> - **API Stability:** Tool interfaces may change without notice between versions
> - **Production Use:** Not recommended for production environments
> - **Testing:** Always test thoroughly in development environments first
> - **Contributions:** Feature requests and bug reports welcome, but implementation timeline depends on solo developer availability
>
> Use at your own risk. This is experimental software provided as-is with no warranties.

## What This Tool Does

Enable Claude AI to autonomously control iOS simulators, test applications, debug issues, and analyze app behavior through natural language commands. Claude can write code, build projects, run them in the simulator, execute UI tests, read crash logs, iterate on fixes, and verify everything works - all without manual debugging.

## Status

**Current Version:** 0.4.0 (Active Development)

### Available Features

✅ **Simulator Device Management** (4 tools)
- `simulator_list_devices` - List all available iOS simulators
- `simulator_boot` - Boot a simulator device
- `simulator_shutdown` - Shutdown a running simulator
- `simulator_get_info` - Get detailed device information

✅ **Simulator UI Interaction** (4 tools)
- `simulator_screenshot` - Capture and compress screenshots (JPEG, 80% quality)
- `simulator_tap` - Tap at specific coordinates
- `simulator_swipe` - Swipe gestures with direction detection
- `simulator_long_press` - Long press for context menus

✅ **Simulator UI Inspection** (2 tools) - *Requires fb-idb*
- `simulator_describe_ui` - Get full accessibility tree (all UI elements with labels, roles, bounds)
- `simulator_describe_point` - Get accessibility info for element at specific coordinates

✅ **Simulator App Management** (6 tools)
- `simulator_launch_app` - Launch apps by bundle identifier
- `simulator_terminate_app` - Force quit running apps
- `simulator_install_app` - Install .app bundles
- `simulator_uninstall_app` - Remove apps and their data
- `simulator_open_url` - Open URLs and deep links
- `simulator_get_logs` - Retrieve filtered log entries

✅ **Simulator Input Simulation** (3 tools)
- `simulator_type_text` - Type text into focused text fields
- `simulator_press_home` - Press home button
- `simulator_send_keys` - Send hardware keyboard shortcuts

✅ **Simulator Debugging & Automation** (6 tools) - *Requires fb-idb*
- `simulator_list_crashes` - List crash reports with filtering by bundle ID, date range
- `simulator_get_crash` - Retrieve full crash logs with stacktraces
- `simulator_delete_crashes` - Clean up crash reports
- `simulator_stream_logs` - Real-time log monitoring with predicate filters
- `simulator_input_text` - Type text into focused fields (advanced)
- `simulator_press_button` - Simulate hardware buttons (HOME, LOCK, SIRI, APPLE_PAY, SIDE_BUTTON)

✅ **Build & Test Tools** (4 tools)
- `xcodebuild_build` - Build apps for simulator with error parsing (automatically tracks build times)
- `xcodebuild_clean` - Clean build artifacts and derived data
- `xcodebuild_test` - Run unit and UI tests with structured results
- `xcodebuild_build_stats` - Get build time statistics, trends, and performance insights

✅ **Environment Control** (12 tools)
- `simulator_status_bar_override` - Set time, network indicators, battery for demo screenshots
- `simulator_status_bar_list` - List current status bar overrides
- `simulator_status_bar_clear` - Clear all status bar overrides
- `simulator_set_appearance` - Switch between light/dark mode
- `simulator_get_appearance` - Get current appearance mode
- `simulator_set_content_size` - Set Dynamic Type size for accessibility testing
- `simulator_get_content_size` - Get current Dynamic Type size
- `simulator_set_increase_contrast` - Enable/disable increased contrast mode
- `simulator_grant_permission` - Grant privacy permissions without prompting
- `simulator_revoke_permission` - Revoke privacy permissions
- `simulator_reset_permissions` - Reset permissions to prompt on next use
- `simulator_send_push_notification` - Send simulated push notifications

✅ **Location Simulation** (4 tools)
- `simulator_set_location` - Set GPS coordinates for testing location-based features
- `simulator_simulate_route` - Simulate movement along a route with waypoints
- `simulator_list_location_scenarios` - List available predefined location scenarios
- `simulator_clear_location` - Stop location simulation and clear any set location

✅ **Media Management** (3 tools)
- `simulator_start_video_recording` - Start recording simulator screen to video
- `simulator_stop_video_recording` - Stop the current video recording
- `simulator_add_media` - Add photos, videos, or contacts to the simulator

✅ **Developer Utilities** (8 tools)
- `simulator_get_app_container_path` - Get file system path to app's container
- `simulator_clipboard_copy` - Copy text to simulator's clipboard
- `simulator_clipboard_paste` - Get text from simulator's clipboard
- `simulator_clipboard_sync` - Sync clipboard between two simulators
- `simulator_add_root_certificate` - Add trusted root certificate for SSL testing
- `simulator_add_certificate` - Add certificate to simulator's keychain
- `simulator_reset_keychain` - Reset simulator's keychain
- `simulator_trigger_icloud_sync` - Trigger iCloud sync on the simulator

### Coming Soon

🚧 **Additional Build Tools**
- Archive & export for distribution
- Performance profiling with Instruments

## Installation

### Prerequisites

- **macOS** (iOS Simulator only available on macOS)
- **Xcode** 15+ with Command Line Tools installed
- **Node.js** 18+

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ios-dev-mcp-server.git
cd ios-dev-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Installing fb-idb (Required for Advanced Features)

**11 of 23 simulator tools require fb-idb** (iOS Development Bridge) to be installed. These include all UI interaction tools (tap, swipe, long-press), UI inspection tools (describe_ui, describe_point), and all debugging/automation tools (crash logs, log streaming, text input, button press).

**Installation Steps:**

```bash
# 1. Install idb_companion via Homebrew
brew tap facebook/fb
brew install idb-companion

# 2. Install idb client via Python pip (in virtual environment)
python3 -m venv ~/.idb-venv
source ~/.idb-venv/bin/activate
pip install fb-idb

# 3. Create symlink for global access
mkdir -p ~/bin
ln -sf ~/.idb-venv/bin/idb ~/bin/idb

# 4. Verify installation
~/bin/idb list-targets
```

**What gets installed:**
- `idb_companion` - Server process that communicates with simulators/devices (via Homebrew)
- `idb` - Client CLI tool (via Python pip in virtual environment)
- Symlink at `~/bin/idb` - Allows MCP server to find idb executable

**Testing the installation:**

```bash
# Boot a simulator (if not already running)
xcrun simctl boot "iPhone 17"

# Connect idb to the simulator
~/bin/idb connect <DEVICE_UDID>

# Test UI inspection
~/bin/idb ui describe-all --udid <DEVICE_UDID>
```

**Tools that require idb:**
- `simulator_tap`, `simulator_swipe`, `simulator_long_press` - UI interaction
- `simulator_describe_ui`, `simulator_describe_point` - UI inspection
- `simulator_list_crashes`, `simulator_get_crash`, `simulator_delete_crashes` - Crash management
- `simulator_stream_logs` - Real-time log monitoring
- `simulator_input_text` - Text field input
- `simulator_press_button` - Hardware button simulation

**Tools that work without idb:**
- All device management tools (boot, shutdown, device info)
- All app lifecycle tools (launch, terminate, install, uninstall)
- Screenshot tool
- Build and test tools

## Usage

### Claude Code Integration (Recommended) 🚀

**Manual Installation:**

1. Build the project:
```bash
npm install
npm run build
```

2. Configure Claude Code by adding to `~/.config/claude-code/settings.json`:
```json
{
  "mcpServers": {
    "ios-dev": {
      "command": "node",
      "args": ["/absolute/path/to/ios-dev-mcp-server/build/index.js"],
      "metadata": {
        "name": "iOS Development MCP Server",
        "description": "Comprehensive iOS simulator control and Swift/Xcode development tools",
        "version": "0.4.0"
      }
    }
  }
}
```

3. Install skills:
```bash
cp -r skills/* ~/.claude/skills/public/
```

**Note:** Replace `/absolute/path/to/ios-dev-mcp-server` with your actual project path.

**Example Prompts:**

After installation, try asking Claude:
- "List all available iOS simulators"
- "Boot an iPhone 15 Pro simulator"
- "Take a screenshot of the booted simulator"
- "Install my app at ./build/MyApp.app and launch it"
- "Test my app's login flow and debug any issues"
- "Get the last 100 logs from the simulator filtered by my app"
- "Profile the app's performance during navigation"

### Claude Desktop Integration

Add to your Claude Desktop config file:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ios-dev": {
      "command": "node",
      "args": ["/absolute/path/to/ios-dev-mcp-server/build/index.js"]
    }
  }
}
```

**Important:** Use the absolute path to the build directory.

### Testing the Installation

Launch MCP Inspector for interactive testing:

```bash
npm run inspector
```

Opens web UI at http://localhost:6274 where you can test all available tools.

## Working with Claude Code Skills

This repository provides both **MCP tools** (23 iOS simulator tools) AND **curated skills** (11 iOS/Swift development workflows) that work together seamlessly.

### What's Included

- **MCP Tools:** 23 tools for iOS simulator control (device management, UI interaction, app management, debugging, etc.)
- **Skills:** 11 specialized workflows for iOS development (in the `/skills` directory)
- **Claude Code Skills:** Built-in skills like `/test-driven-development`, `/systematic-debugging`
- **Together:** Claude uses disciplined workflows (skills) to orchestrate these iOS tools effectively

### Included Skills (11 total)

This repository includes curated skills from the community:

**Swift & Concurrency (2 skills)**
- `swift-concurrency-expert` - Swift 6.2+ concurrency fixes and actor isolation
- `swift-concurrency-avdlee` - Comprehensive async/await, actors, and migration guidance

**iOS Development (3 skills)**
- `ios-debugger-agent` - Build, run, and debug iOS apps using this MCP server's tools ⭐
- `app-store-changelog` - Generate user-facing release notes from git history
- `gh-issue-fix-flow` - End-to-end GitHub issue resolution workflow

**SwiftUI (4 skills)**
- `swiftui-ui-patterns` - Best practices for state management and composition
- `swiftui-view-refactor` - Standardize view structure and dependencies
- `swiftui-performance-audit` - Identify and fix performance bottlenecks
- `swiftui-liquid-glass` - iOS 26+ Liquid Glass API implementation

**macOS Packaging (1 skill)**
- `macos-spm-app-packaging` - Package SwiftPM apps without Xcode

See [skills/README.md](skills/README.md) for detailed documentation.

### Recommended Workflow Combinations

**Debugging iOS Apps:**
```
Skill: ios-debugger-agent (included in this repo!)
Tools: simulator_boot, simulator_install_app, simulator_launch_app,
       simulator_screenshot, simulator_get_logs, simulator_tap

Flow: Boot → Install → Launch → Screenshot → Interact → Analyze logs
```

**Test-Driven iOS Development:**
```
Skill: /test-driven-development (Claude Code built-in)
Tools: simulator_install_app, simulator_launch_app, simulator_get_logs

Flow: Write test → Build → Install → Run → Verify logs → Iterate
```

**Fixing GitHub Issues:**
```
Skill: gh-issue-fix-flow (included in this repo!)
Tools: simulator tools for testing, git for commits

Flow: Fetch issue → Locate code → Fix → Test with simulator → Commit → Report
```

**Swift Concurrency Review:**
```
Skill: swift-concurrency-expert (included in this repo!)
Tools: Code analysis and refactoring

Flow: Triage errors → Apply actor isolation → Fix Sendable issues → Verify
```

### Installing Skills

To install skills:

```bash
# Copy skills to Claude Code
cp -r skills/* ~/.claude/skills/public/

# Or symlink to keep them updated
ln -s $(pwd)/skills/* ~/.claude/skills/public/
```

### Learn More

- **Included Skills:** See [skills/README.md](skills/README.md) for detailed documentation of all 11 skills
- **Claude Code Built-in Skills:** Use `/using-superpowers` in Claude Code
- **Swift Concurrency:** [fuckingapproachableswiftconcurrency.com](https://fuckingapproachableswiftconcurrency.com/en/)

## How to Use Skills in Claude

### What Are Skills?

Skills are specialized workflows that guide Claude on **how** to approach specific types of tasks. Think of them as expert playbooks:
- **MCP Tools** (this server) = What Claude **can do** (23 simulator tools)
- **Skills** (this repo) = How Claude **should do it** (11 workflows)

### Installation

#### Installation

Install skills by copying them to Claude Code's skills directory:

```bash
# Copy all skills to Claude Code
cp -r skills/* ~/.claude/skills/public/

# Or symlink to keep skills updated with this repository
ln -s $(pwd)/skills/app-store-changelog ~/.claude/skills/public/
ln -s $(pwd)/skills/ios-debugger-agent ~/.claude/skills/public/
# ... repeat for all skills
```

This copies all 11 skills to `~/.claude/skills/public/` where Claude Code can access them.

#### Verify Installation

After installation, restart Claude Code and verify skills are available:

```
User: "What iOS development skills are available?"
Claude: [Lists all installed skills]
```

### How to Invoke Skills

Skills are invoked automatically by Claude when you describe a task that matches the skill's purpose. You can also explicitly request a skill.

#### Automatic Invocation

Claude automatically uses skills when your request matches their purpose:

```
You: "Debug my app's login flow"
→ Claude uses ios-debugger-agent skill automatically

You: "Fix these Swift concurrency warnings"
→ Claude uses swift-concurrency-expert skill automatically

You: "Add Liquid Glass effect to this button"
→ Claude uses swiftui-liquid-glass skill automatically
```

#### Explicit Invocation

You can explicitly request a skill by name (though this is usually not necessary):

```
You: "Use the ios-debugger-agent skill to test my app"
→ Claude loads and follows the ios-debugger-agent workflow

You: "Run the swift-concurrency-expert skill on this file"
→ Claude applies concurrency review to the file
```

### Skill Usage Examples

#### Example 1: Debugging an iOS App

```
You: "My app crashes when I tap the login button. Can you debug it?"

Claude's Workflow (using ios-debugger-agent skill):
1. ✓ Lists simulators (simulator_list_devices)
2. ✓ Boots iPhone 15 Pro (simulator_boot)
3. ✓ Builds your app (xcodebuild_build)
4. ✓ Installs app (simulator_install_app)
5. ✓ Launches app (simulator_launch_app)
6. ✓ Takes screenshot (simulator_screenshot)
7. ✓ Taps login button (simulator_tap)
8. ✓ Captures crash logs (simulator_get_logs)
9. ✓ Analyzes issue and suggests fix
```

#### Example 2: Fixing Swift Concurrency Issues

```
You: "I'm getting data race warnings in Swift 6. Help fix them."

Claude's Workflow (using swift-concurrency-expert skill):
1. ✓ Captures compiler diagnostics
2. ✓ Checks project Swift version and concurrency settings
3. ✓ References Swift-Concurrency-Updates.md (Apple docs)
4. ✓ Identifies isolation boundaries
5. ✓ Applies minimal fixes (adds @MainActor, actor isolation)
6. ✓ Verifies Sendable conformance
7. ✓ Rebuilds and verifies warnings are fixed
```

#### Example 3: Implementing Modern SwiftUI Features

```
You: "Add Liquid Glass material to my SwiftUI card view"

Claude's Workflow (using swiftui-liquid-glass skill):
1. ✓ References SwiftUI-Implementing-Liquid-Glass-Design.md
2. ✓ Checks iOS 26 availability
3. ✓ Applies .glassEffect() modifier
4. ✓ Adds GlassEffectContainer for multiple elements
5. ✓ Implements fallback for iOS < 26
6. ✓ Verifies modifier ordering and interactivity
```

#### Example 4: Creating App Store Release Notes

```
You: "Generate release notes for version 2.0"

Claude's Workflow (using app-store-changelog skill):
1. ✓ Runs git log to get commits since last version
2. ✓ Filters for user-visible changes
3. ✓ Organizes into Features/Improvements/Bug Fixes
4. ✓ Writes benefit-driven bullet points
5. ✓ Keeps under App Store character limits
```

### Checking Available Skills

To see which skills are installed and available:

```
You: "List all available iOS development skills"
or
You: "What skills can help with SwiftUI?"
or
You: "What concurrency skills do you have?"
```

Claude will list the relevant skills with descriptions.

### Skills + MCP Tools Working Together

The real power comes from skills orchestrating the MCP tools:

| Task | Skill Used | MCP Tools Used |
|------|------------|----------------|
| Debug app crash | `ios-debugger-agent` | simulator_boot, simulator_install_app, simulator_launch_app, simulator_screenshot, simulator_tap, simulator_get_logs |
| Test feature | Built-in TDD | xcodebuild_test, simulator_install_app, simulator_launch_app, simulator_get_logs |
| Fix concurrency | `swift-concurrency-expert` | Code analysis tools |
| Review performance | `swiftui-performance-audit` | Code analysis + simulator_screenshot for visual verification |

### Tips for Best Results

1. **Be specific about your goal:**
   - ✅ "Debug the login crash" → ios-debugger-agent activates
   - ❌ "Help with my app" → Too vague

2. **Mention the technology when relevant:**
   - ✅ "Fix Swift concurrency errors" → swift-concurrency-expert
   - ✅ "Add Liquid Glass to button" → swiftui-liquid-glass

3. **Let Claude choose the skill:**
   - Skills activate automatically based on your request
   - Only specify a skill name if Claude isn't using the right one

4. **Trust the workflow:**
   - Skills follow proven patterns from expert developers
   - They include error handling and verification steps

### Skill Descriptions Reference

For quick reference, here's what each skill does:

| Skill | Use When You Need To... |
|-------|-------------------------|
| **ios-debugger-agent** | Build, run, and debug iOS apps using the simulator |
| **swift-concurrency-expert** | Fix Swift 6.2+ concurrency warnings and data race issues |
| **swift-concurrency-avdlee** | Learn async/await patterns or migrate to Swift 6 |
| **swiftui-liquid-glass** | Implement iOS 26+ Liquid Glass material effects |
| **swiftui-ui-patterns** | Follow SwiftUI best practices for state, composition, and navigation |
| **swiftui-view-refactor** | Standardize SwiftUI view structure and organization |
| **swiftui-performance-audit** | Diagnose and fix SwiftUI performance issues |
| **app-store-changelog** | Generate user-facing release notes from git commits |
| **gh-issue-fix-flow** | Resolve GitHub issues with testing and documentation |
| **macos-spm-app-packaging** | Package macOS apps using Swift Package Manager |

### Detailed Skill Documentation

For comprehensive documentation on each skill, including reference materials and examples:

📖 **[Read the Skills Guide](skills/README.md)**

This includes:
- Detailed descriptions of all 11 skills
- Installation instructions
- Skill category breakdown
- Integration with MCP tools
- Official Apple documentation references
- Troubleshooting tips

## Available Tools

### Simulator Device Management

#### simulator_list_devices
List all available iOS simulator devices with their current states.

**Parameters:** None

**Example Response:**
```json
{
  "summary": "Found 5 device(s) (1 booted)",
  "devices": [
    {
      "udid": "ABC-123-DEF",
      "name": "iPhone 15 Pro",
      "state": "Booted",
      "runtime": "iOS 17.2",
      "deviceType": "iPhone15,2"
    }
  ]
}
```

#### simulator_boot
Boot an iOS simulator device by UDID.

**Parameters:**
- `device` (string, required): Device UDID to boot

**Usage:** "Boot the iPhone 15 Pro simulator"

#### simulator_shutdown
Shutdown a running iOS simulator device.

**Parameters:**
- `device` (string, required): Device UDID to shutdown

**Usage:** "Shutdown the booted simulator"

#### simulator_get_info
Get detailed information about a specific simulator device.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Usage:** "Get info about the booted simulator"

### Simulator UI Interaction

#### simulator_screenshot
Capture a screenshot from the iOS simulator with automatic compression.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `quality` (number, optional): JPEG quality 1-100 (default: 80)
- `maxWidth` (number, optional): Maximum width in pixels (default: 800)
- `maxHeight` (number, optional): Maximum height in pixels (default: 1400)

**Returns:**
- Base64-encoded JPEG image
- Compression metadata (original size, compressed size, ratio)

**Usage:** "Take a screenshot of the simulator"

**Advanced UI Interaction Tools - *Requires fb-idb***

**Note:** The following interaction tools require [fb-idb](https://fbidb.io) to be installed:
```bash
brew install idb-companion
brew services start idb_companion
```

If Homebrew installation fails, build from source: https://github.com/facebook/idb

#### simulator_tap
Tap at specific x,y coordinates on the simulator screen.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `x` (number, required): X coordinate in pixels
- `y` (number, required): Y coordinate in pixels

**Usage:** "Tap at coordinates 200, 400 on the simulator"

#### simulator_swipe
Perform a swipe gesture from one point to another.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `x1` (number, required): Start X coordinate
- `y1` (number, required): Start Y coordinate
- `x2` (number, required): End X coordinate
- `y2` (number, required): End Y coordinate
- `duration` (number, optional): Swipe duration in seconds (default: 0.3)

**Returns:**
- Swipe direction (left, right, up, down)
- Distance in pixels

**Usage:** "Swipe from 200,800 to 200,200 on the simulator"

#### simulator_long_press
Perform a long press (tap and hold) at specific coordinates.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `x` (number, required): X coordinate in pixels
- `y` (number, required): Y coordinate in pixels
- `duration` (number, optional): Press duration in seconds (default: 1.0)

**Usage:** "Long press at coordinates 300, 500 for 2 seconds"

### Simulator UI Inspection

**Note:** These tools require [fb-idb](https://fbidb.io) to be installed:
```bash
brew install idb-companion
```

#### simulator_describe_ui
Get the full accessibility tree (UI hierarchy) of the current simulator screen.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `format` (string, optional): Output format - "compact" (human-readable summary) or "json" (full details) (default: "compact")

**Returns:**
- List of all UI elements with:
  - AXLabel (accessibility label)
  - AXRole (element type: Button, TextField, StaticText, etc.)
  - AXFrame (position and size: [X,Y WxH])
  - AXEnabled (whether element is interactive)
  - AXTraits (additional element traits)
  - Custom actions (if any)

**Compact format example:**
```
1. Button: "Login" [150,650 120x44]
2. TextField: "Email" [50,550 300x40]
3. StaticText: "Welcome" [100,200 200x30]
```

**Usage:**
```
"Describe all UI elements on the screen"
"Get the accessibility tree in JSON format"
"What UI elements are visible on the simulator?"
```

**Common use cases:**
- Find elements by label before tapping
- Verify UI element positions
- Debug accessibility implementation
- Automated UI testing
- Document screen components

#### simulator_describe_point
Get accessibility information for the UI element at specific coordinates.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `x` (number, required): X coordinate in pixels
- `y` (number, required): Y coordinate in pixels

**Returns:**
- Element details at the specified point:
  - label (accessibility label or value)
  - role (element type)
  - frame (position and size)
  - enabled (interaction state)
  - traits (accessibility traits)
  - fullDetails (complete accessibility data)

**Usage:**
```
"What UI element is at coordinates 200, 400?"
"Describe the element at point 150, 600"
"Inspect the UI element at 300, 800"
```

**Common use cases:**
- Verify what element exists before tapping
- Debug tap target issues (too small, wrong element)
- Inspect element properties at specific locations
- Validate UI layout programmatically

### Simulator Debugging & Automation (6 tools) - *Requires fb-idb*

**Note:** These tools require [fb-idb](https://fbidb.io) to be installed:
```bash
brew install idb-companion
brew services start idb_companion
```

#### simulator_list_crashes
List crash reports from the iOS simulator with optional filtering.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, optional): Filter crashes by app bundle identifier (e.g., "com.example.MyApp")
- `before` (string, optional): Filter crashes before this date (ISO 8601 format: "2024-01-15T10:30:00Z")
- `since` (string, optional): Filter crashes since this date (ISO 8601 format: "2024-01-15T10:30:00Z")

**Returns:**
- List of crash reports with:
  - Crash name/identifier
  - Bundle ID
  - Crash timestamp

**Example output:**
```
Found 2 crash report(s):

1. MyApp-2024-01-15-123456.crash
   Bundle: com.example.MyApp
   Date: 2024-01-15T12:34:56Z

2. MyApp-2024-01-14-098765.crash
   Bundle: com.example.MyApp
   Date: 2024-01-14T09:87:65Z
```

**Usage:** "List all crashes for com.example.MyApp", "Show recent crashes from the last 24 hours"

#### simulator_get_crash
Retrieve a specific crash report with full stacktrace and crash details.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `crashName` (string, required): Crash report name/identifier from `simulator_list_crashes`

**Returns:**
- Full crash report including:
  - Exception type and reason
  - Complete stacktrace
  - Thread information
  - Binary images
  - Hardware/OS information

**Usage:** "Get the crash report MyApp-2024-01-15-123456.crash", "Show me the details of the most recent crash"

#### simulator_delete_crashes
Delete crash reports from the simulator to clean up old crashes.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `crashName` (string, optional): Specific crash name to delete
- `before` (string, optional): Delete crashes before this date (ISO 8601)
- `since` (string, optional): Delete crashes since this date (ISO 8601)
- `all` (boolean, optional): Delete all crashes (use with caution, default: false)

**Usage:** "Delete all crash reports", "Delete crashes older than one week"

#### simulator_stream_logs
Stream real-time logs from the iOS simulator with optional filtering.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `predicate` (string, optional): Log predicate filter (e.g., `'processImagePath CONTAINS "MyApp"'` or `'subsystem == "com.example.myapp"'`)
- `style` (string, optional): Output style - "default" (full), "compact" (minimal), or "json" (structured) (default: "default")

**Note:** This is a blocking operation that streams logs continuously until stopped (10 minute timeout).

**Common predicate examples:**
```
processImagePath CONTAINS "MyApp"           # Filter by app name
subsystem == "com.example.myapp"            # Filter by subsystem
category == "networking"                     # Filter by category
messageType == "error" OR messageType == "fault"  # Errors only
```

**Usage:** "Stream logs for MyApp", "Show real-time error logs from the simulator"

#### simulator_input_text
Input text into the currently focused text field on the simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `text` (string, required): Text to input into the focused field

**Important:** A text field must be focused before calling this tool. Use `simulator_tap` or `simulator_describe_ui` to locate and tap a text field first.

**Returns:**
- Success confirmation with the text that was input

**Usage:** "Type 'test@example.com' into the email field", "Input 'Hello World' into the focused text box"

**Workflow example:**
1. Use `simulator_describe_ui` to find text field coordinates
2. Use `simulator_tap` to focus the text field
3. Use `simulator_input_text` to type the text

#### simulator_press_button
Simulate hardware button presses on the iOS simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `button` (string, required): Hardware button to press
  - `HOME` - Home button (not available on newer devices without physical home button)
  - `LOCK` - Lock/power button
  - `SIDE_BUTTON` - Side button (newer devices)
  - `SIRI` - Siri button
  - `APPLE_PAY` - Apple Pay button

**Returns:**
- Success confirmation with the button that was pressed

**Note:** Button availability depends on the device model. For example, `HOME` is not available on iPhone models without a physical home button (iPhone X and newer).

**Usage:** "Press the home button", "Lock the device", "Activate Siri"

**Common use cases:**
- Test app behavior when backgrounded (HOME button)
- Test lock screen functionality (LOCK button)
- Test Siri integration (SIRI button)
- Test Apple Pay flows (APPLE_PAY button)

### Simulator App Management

#### simulator_launch_app
Launch an iOS app on the simulator by its bundle identifier.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, required): App bundle identifier (e.g., "com.apple.mobilesafari")

**Returns:**
- Process ID (PID) if available
- Success confirmation

**Usage:** "Launch com.mycompany.myapp on the simulator"

#### simulator_terminate_app
Force quit a running app on the simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `bundleId` (string, required): App bundle identifier to terminate

**Usage:** "Terminate com.apple.mobilesafari"

#### simulator_install_app
Install an iOS app (.app bundle) on the simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `appPath` (string, required): Path to .app bundle (absolute or relative)

**Returns:**
- Installation confirmation
- Resolved app path

**Usage:** "Install the app at ./build/Debug-iphonesimulator/MyApp.app"

#### simulator_uninstall_app
Uninstall an app from the simulator, removing the app and all its data.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `bundleId` (string, required): App bundle identifier to uninstall

**Usage:** "Uninstall com.mycompany.myapp from the simulator"

#### simulator_open_url
Open a URL on the simulator. Supports web URLs (Safari), deep links, and universal links.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `url` (string, required): URL to open (http://, https://, or custom scheme)

**Usage:**
```
"Open https://apple.com on the simulator"
"Open myapp://settings/profile on the simulator"
```

#### simulator_get_logs
Retrieve recent log entries from the simulator with optional filtering.

**Parameters:**
- `device` (string, optional): Device UDID or "booted"
- `predicate` (string, optional): Log predicate filter (e.g., `processImagePath CONTAINS "MyApp"`)
- `lines` (number, optional): Number of recent lines to return (default: 100)
- `level` (string, optional): Minimum log level ("debug", "info", "default", "error", "fault")

**Returns:**
- Filtered log entries
- Total and returned line counts
- Applied filters

**Usage:**
```
"Get logs for MyApp with errors only"
"Get the last 50 log lines from the simulator"
```

### Simulator Input Simulation

#### simulator_type_text
Type text into the currently focused text field on the simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `text` (string, required): Text to type into the focused text field

**Returns:**
- Number of characters typed
- Success confirmation

**Requirements:**
- A text field must be active (keyboard visible) before typing

**Usage:**
```
"Type 'Hello World' into the simulator"
"Type 'test@example.com' into the email field"
```

#### simulator_press_home
Press the home button to return to the home screen.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success confirmation

**Usage:** "Press the home button on the simulator"

#### simulator_send_keys
Send hardware keyboard input and shortcuts to the simulator.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `text` (string, required): Key or shortcut to send

**Supported Shortcuts:**
- `cmd-h` or `home` - Home button
- `cmd-l` or `lock` - Lock screen
- `cmd-shift-h` or `app-switcher` - App switcher
- `siri` - Activate Siri

**Returns:**
- Action performed
- Success confirmation

**Usage:**
```
"Send cmd-h to go home"
"Send lock to lock the screen"
"Send siri to activate Siri"
```

### Environment Control

#### simulator_status_bar_override
Override the simulator status bar appearance for demo screenshots and testing.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `time` (string, optional): Time to display (e.g., "9:41" or ISO date string)
- `dataNetwork` (enum, optional): Network type - "hide", "wifi", "3g", "4g", "lte", "lte-a", "lte+", "5g", "5g+", "5g-uwb", "5g-uc"
- `wifiMode` (enum, optional): WiFi mode - "searching", "failed", "active"
- `wifiBars` (number, optional): WiFi signal strength (0-3 bars)
- `cellularMode` (enum, optional): Cellular mode - "notSupported", "searching", "failed", "active"
- `cellularBars` (number, optional): Cellular signal strength (0-4 bars)
- `operatorName` (string, optional): Carrier/operator name
- `batteryState` (enum, optional): Battery state - "charging", "charged", "discharging"
- `batteryLevel` (number, optional): Battery level percentage (0-100)

**Returns:**
- Success status
- Applied overrides summary

**Usage:**
```
"Set the status bar to show 9:41, full WiFi, and 100% battery"
"Make it look like demo mode with full signal and charged battery"
"Set battery to 20% and charging"
```

#### simulator_status_bar_list
List current status bar overrides on a simulator device.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Current status bar overrides

**Usage:**
```
"Show current status bar overrides"
"List status bar settings"
```

#### simulator_status_bar_clear
Clear all status bar overrides, returning the simulator to its natural state.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success status

**Usage:**
```
"Clear all status bar overrides"
"Reset status bar to normal"
```

#### simulator_set_appearance
Set the simulator appearance mode to light or dark.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `mode` (enum, required): Appearance mode - "light" or "dark"

**Returns:**
- Success status
- Applied mode

**Usage:**
```
"Switch to dark mode"
"Set appearance to light mode"
"Enable dark mode for testing"
```

#### simulator_get_appearance
Get the current simulator appearance mode.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Current appearance mode (light, dark, unsupported, or unknown)

**Usage:**
```
"What's the current appearance mode?"
"Check if dark mode is enabled"
```

#### simulator_set_content_size
Set the preferred content size category for Dynamic Type testing.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `size` (enum, required): Content size category
  - Standard: "extra-small", "small", "medium", "large", "extra-large", "extra-extra-large", "extra-extra-extra-large"
  - Accessibility: "accessibility-medium", "accessibility-large", "accessibility-extra-large", "accessibility-extra-extra-large", "accessibility-extra-extra-extra-large"

**Returns:**
- Success status
- Applied size

**Usage:**
```
"Set text size to accessibility-extra-large"
"Test the app with the largest text size"
"Set Dynamic Type to small"
```

#### simulator_get_content_size
Get the current preferred content size category.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Current content size category

**Usage:**
```
"What's the current text size?"
"Check Dynamic Type setting"
```

#### simulator_set_increase_contrast
Enable or disable increased contrast mode for accessibility testing.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `enabled` (boolean, required): Whether to enable or disable increased contrast

**Returns:**
- Success status
- Enabled state

**Usage:**
```
"Enable increased contrast mode"
"Disable increased contrast"
"Turn on high contrast for testing"
```

#### simulator_grant_permission
Grant a privacy permission to an app without prompting.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, required): Bundle identifier of the target application
- `service` (enum, required): Permission service - "all", "calendar", "contacts-limited", "contacts", "location", "location-always", "photos-add", "photos", "media-library", "microphone", "motion", "reminders", "siri"

**Returns:**
- Success status
- Granted permission details

**Usage:**
```
"Grant location permission to the app"
"Give the app access to photos"
"Grant microphone permission for testing"
```

#### simulator_revoke_permission
Revoke a privacy permission from an app.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, required): Bundle identifier of the target application
- `service` (enum, required): Permission service to revoke

**Returns:**
- Success status
- Revoked permission details

**Usage:**
```
"Revoke location permission from the app"
"Remove camera access"
"Deny microphone permission"
```

#### simulator_reset_permissions
Reset privacy permissions to default state, prompting on next use.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, optional): Bundle identifier (omit to reset all apps)
- `service` (enum, optional): Service to reset (omit to reset all services)

**Returns:**
- Success status
- Reset scope details

**Usage:**
```
"Reset all permissions for the app"
"Reset location permissions for all apps"
"Reset all permissions on the device"
```

#### simulator_send_push_notification
Send a simulated push notification to an app.

**Parameters:**
- `device` (string, optional): Device UDID or "booted" (default: "booted")
- `bundleId` (string, required): Bundle identifier of the target application
- `payload` (object, required): JSON payload (must include "aps" key, max 4096 bytes)

**Returns:**
- Success status
- Payload size

**Usage:**
```
"Send a push notification saying 'New message from Alice'"
"Send a test notification with badge 5"
"Send a silent push notification with custom data"
```

**Example Payload:**
```json
{
  "aps": {
    "alert": {
      "title": "Test Notification",
      "body": "This is a test message"
    },
    "badge": 1,
    "sound": "default"
  },
  "customData": {
    "key": "value"
  }
}
```

### Location Simulation

#### simulator_set_location
Set a specific GPS location for the simulator.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `latitude` (required): Latitude (-90 to 90)
- `longitude` (required): Longitude (-180 to 180)

**Returns:**
- Success confirmation with coordinates
- Device identifier

**Usage:**
```
"Set the simulator location to San Francisco"
"Set GPS to 37.7749, -122.4194"
"Change location to Tokyo coordinates"
```

#### simulator_simulate_route
Simulate movement along a route defined by waypoints.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `waypoints` (required): Array of coordinate objects (minimum 2 points)
  - Each waypoint: `{ latitude: number, longitude: number }`
- `speed` (optional): Speed in meters/second (default: 20 m/s ≈ 45 mph)
- `updateInterval` (optional): Seconds between location updates
- `updateDistance` (optional): Meters between location updates

**Returns:**
- Success confirmation
- Number of waypoints
- Speed setting
- Note about stopping simulation

**Usage:**
```
"Simulate driving from San Francisco to Los Angeles"
"Create a route from these coordinates: [SF, LA, Vegas] at highway speed"
"Simulate walking route between 5 waypoints at 1.5 m/s"
```

#### simulator_list_location_scenarios
List available predefined location scenarios.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- List of available location scenarios (e.g., City Run, City Bicycle Ride, Freeway Drive)

**Usage:**
```
"What location scenarios are available?"
"List all predefined routes"
```

#### simulator_clear_location
Stop location simulation and clear any set location.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success confirmation

**Usage:**
```
"Stop the current location simulation"
"Clear the GPS override"
"Reset location to default"
```

### Media Management

#### simulator_start_video_recording
Start recording the simulator screen to a video file.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `outputPath` (required): Output file path for the recorded video
- `codec` (optional): Video codec - "h264" or "hevc" (default: "hevc")
- `display` (optional): Display to record - "internal" or "external" (default: "internal")
- `mask` (optional): Mask to apply - "ignored", "alpha", or "black"

**Returns:**
- Success confirmation
- Output path
- Codec and display settings
- Note about stopping

**Usage:**
```
"Start recording the simulator to demo.mov"
"Record a video using h264 codec"
"Start screen recording with external display"
```

#### simulator_stop_video_recording
Stop the current video recording and save the file.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success confirmation

**Usage:**
```
"Stop the video recording"
"Finish recording and save"
```

#### simulator_add_media
Add photos, videos, or contacts to the simulator.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `files` (required): Array of file paths to add (photos, videos, contacts)

**Returns:**
- Success confirmation
- Number of files added
- List of file paths

**Usage:**
```
"Add these 3 photos to the simulator's photo library"
"Add test-photo.jpg and test-video.mov to the simulator"
"Import this contact.vcf file"
```

### Developer Utilities

#### simulator_get_app_container_path
Get the file system path to an app's container.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `bundleId` (required): Bundle identifier of the target application
- `container` (optional): Container type - "app", "data", "groups", or a group ID (default: "app")

**Returns:**
- Success confirmation
- Container path
- Container type

**Usage:**
```
"Get the data container path for com.example.app"
"Where does com.example.app store its files?"
"Get the App Group container for group.com.example.shared"
```

#### simulator_clipboard_copy
Copy text to the simulator's clipboard.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `text` (required): Text to copy to the simulator clipboard

**Returns:**
- Success confirmation
- Text length

**Usage:**
```
"Copy 'Hello World' to the simulator clipboard"
"Put this URL in the simulator's clipboard"
```

#### simulator_clipboard_paste
Get the current text from the simulator's clipboard.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Clipboard text content

**Usage:**
```
"What's on the simulator's clipboard?"
"Get the clipboard content"
```

#### simulator_clipboard_sync
Sync clipboard from one simulator to another.

**Parameters:**
- `sourceDevice` (optional): Source device UDID or "booted" (default: "booted")
- `targetDevice` (required): Target device UDID

**Returns:**
- Success confirmation
- Source and target device identifiers

**Usage:**
```
"Sync clipboard to device ABC123"
"Copy clipboard from current to device XYZ789"
```

#### simulator_add_root_certificate
Add a trusted root certificate to the simulator's keychain.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `certificatePath` (required): Path to the root certificate file (.pem, .cer, .der)

**Returns:**
- Success confirmation
- Certificate path

**Usage:**
```
"Add this root certificate for SSL testing"
"Install the CA cert at /path/to/cert.pem"
```

#### simulator_add_certificate
Add a certificate to the simulator's keychain.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")
- `certificatePath` (required): Path to the certificate file (.pem, .cer, .der)

**Returns:**
- Success confirmation
- Certificate path

**Usage:**
```
"Add this certificate to the keychain"
"Install cert.pem"
```

#### simulator_reset_keychain
Reset the simulator's keychain, removing all certificates and credentials.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success confirmation

**Usage:**
```
"Reset the simulator's keychain"
"Clear all certificates"
```

#### simulator_trigger_icloud_sync
Trigger an iCloud sync on the simulator.

**Parameters:**
- `device` (optional): Device UDID or "booted" (default: "booted")

**Returns:**
- Success confirmation

**Usage:**
```
"Trigger iCloud sync"
"Force an iCloud sync now"
```

### Build & Test Tools

#### xcodebuild_build
Build an iOS app for simulator using xcodebuild.

**Parameters:**
- `workspace` (string, optional): Path to .xcworkspace file
- `project` (string, optional): Path to .xcodeproj file
- `scheme` (string, required): Scheme name to build
- `sdk` (string, optional): SDK to build for (default: "iphonesimulator")
- `configuration` (string, optional): Build configuration - "Debug" or "Release" (default: "Debug")
- `destination` (string, optional): Destination specifier (e.g., "platform=iOS Simulator,name=iPhone 15 Pro")
- `derivedDataPath` (string, optional): Custom derived data path

**Returns:**
- Build success status
- Parsed errors with file paths and line numbers if build fails
- Error count and details

**Usage:**
```
"Build MyApp scheme from MyApp.xcworkspace for simulator"
"Build the Debug configuration of MyApp"
```

#### xcodebuild_clean
Clean build artifacts and derived data for an Xcode project.

**Parameters:**
- `workspace` (string, optional): Path to .xcworkspace file
- `project` (string, optional): Path to .xcodeproj file
- `scheme` (string, required): Scheme name
- `configuration` (string, optional): Build configuration (default: "Debug")
- `derivedDataPath` (string, optional): Custom derived data path

**Returns:**
- Clean success status
- Error details if clean fails

**Usage:**
```
"Clean the MyApp project"
"Clean build artifacts for MyApp scheme"
```

#### xcodebuild_test
Run unit and UI tests using xcodebuild with structured results.

**Parameters:**
- `workspace` (string, optional): Path to .xcworkspace file
- `project` (string, optional): Path to .xcodeproj file
- `scheme` (string, required): Scheme name to test
- `sdk` (string, optional): SDK to test on (default: "iphonesimulator")
- `configuration` (string, optional): Build configuration (default: "Debug")
- `destination` (string, optional): Test destination (e.g., "platform=iOS Simulator,name=iPhone 15 Pro")
- `onlyTesting` (array, optional): Array of test identifiers to run (e.g., ["MyAppTests/testExample"])
- `skipTesting` (array, optional): Array of test identifiers to skip
- `enableCodeCoverage` (boolean, optional): Enable code coverage collection (default: false)
- `derivedDataPath` (string, optional): Custom derived data path

**Returns:**
- Structured test results with:
  - Total, passed, failed, and skipped test counts
  - Test duration
  - Detailed failure information with file paths and line numbers
  - Coverage data (if enabled)

**Usage:**
```
"Run tests for MyApp scheme"
"Run only MyAppTests/testLogin test"
"Run all tests except the slow ones with code coverage"
```

#### xcodebuild_build_stats
Get build time statistics, trends, and performance insights from tracked builds.

**Note:** Build times are tracked automatically whenever you use `xcodebuild_build`. No manual setup required - just start building and statistics accumulate automatically in `~/.ios-mcp/build-times.json`.

**Parameters:**
- `project` (string, optional): Filter by project name or path
- `scheme` (string, optional): Filter by scheme name
- `configuration` (string, optional): Filter by build configuration ("Debug" or "Release")
- `limit` (number, optional): Number of recent builds to analyze (default: 20)

**Returns:**
- **Statistics:**
  - Total builds analyzed
  - Success rate percentage
  - Average, median, min, and max build durations
  - Trend analysis (improving, stable, or degrading)
  - Trend percentage change
- **Insights:** Automated recommendations including:
  - Build time trends (faster or slower over time)
  - Success rate warnings
  - Performance classification (fast/slow builds)
  - Build variance detection
  - Warning/error trending
- **Recent Builds:** Summary of up to 5 most recent builds with status, duration, and warnings

**Usage:**
```
"Show me build statistics for MyApp"
"Get build stats for Release configuration"
"Show build trends for the last 50 builds"
"How are my build times trending?"
```

**Example Output:**
```json
{
  "totalBuilds": 15,
  "successRate": "93.3%",
  "averageDuration": "12.4s",
  "medianDuration": "11.2s",
  "minDuration": "8.5s",
  "maxDuration": "18.7s",
  "trend": "improving",
  "trendPercentage": "8.2%"
}

Insights:
  ✅ Build times improving: 8.2% faster than earlier builds
  ✅ Perfect success rate: all 15 builds succeeded
  ⚡ Fast builds: averaging 12.4s

Recent Builds (5):
  ✅ MyApp - 11.2s - 1/18/2026, 11:05:52 PM
  ✅ MyApp - 10.8s - 1/18/2026, 11:03:21 PM
  ✅ MyApp - 12.1s (2 warnings) - 1/18/2026, 10:58:14 PM
  ✅ MyApp - 11.5s - 1/18/2026, 10:54:03 PM
  ✅ MyApp - 13.2s (1 warnings) - 1/18/2026, 10:49:37 PM
  ... and 10 more
```

## Troubleshooting

### Common Issues

**"Command not found: xcrun"**
- Install Xcode Command Line Tools: `xcode-select --install`

**"No booted devices found"**
- Boot a simulator first: Open Xcode > Open Developer Tool > Simulator
- Or ask Claude: "Boot an iPhone 15 Pro simulator"

**"Failed to install app"**
- Ensure the .app path is correct and the app is built for simulator
- Verify the app is compatible with the booted simulator's iOS version

**"Skills not found in Claude"**
- Ensure skills are copied to `~/.claude/skills/public/`
- Restart Claude Code after installing skills

**Screenshot returns empty/black image**
- Wait a few seconds after launching app before taking screenshot
- Ensure the simulator window is visible (not minimized)

### Getting Help

For issues, questions, or feature requests:
- **GitHub Issues:** [Create an issue](https://github.com/yourusername/ios-dev-mcp-server/issues)

Please include:
1. macOS and Xcode version
2. Node.js version
3. Error message or unexpected behavior
4. Steps to reproduce

## Future Plans

This project is actively maintained by a solo developer. Planned features include:
- Build automation tools
- Test execution and reporting
- Performance profiling integration
- Xcode project management tools
- Swift Package Manager integration

Feature requests are welcome but implementation timeline depends on development priorities.

## License

MIT License

Copyright (c) 2026 iOS Dev MCP Server

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**Note:** This is proprietary software released under MIT license. While you may use and modify the software, this project is solely maintained by a single developer. Contributions are not accepted at this time.
