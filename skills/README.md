# Claude Code Skills for iOS Development

This directory contains curated Claude Code skills specifically designed for iOS, macOS, and Swift development workflows. These skills work seamlessly with the iOS Dev MCP Server tools to provide comprehensive development assistance.

## What Are Skills?

Skills are specialized workflows that guide Claude Code on **how** to approach specific types of tasks. While this MCP server provides **tools** (what Claude can do), skills provide **discipline** (how Claude should use those tools).

### Skills vs Tools

- **MCP Tools** (this repository): 17 tools for iOS simulator control (device management, UI interaction, app management, etc.)
- **Skills** (this directory): Workflows that orchestrate those tools into effective development patterns

## Installation

### For Claude Code

Copy the entire `skills` directory to your Claude Code skills location:

```bash
# From this repository root
cp -r skills/* ~/.claude/skills/public/
```

Or symlink it to keep skills updated with the repository:

```bash
ln -s $(pwd)/skills/* ~/.claude/skills/public/
```

### Verifying Installation

After installing, you can verify skills are available by asking Claude Code:
```
What iOS development skills are available?
```

## Available Skills

### Swift & Concurrency (2 skills)

#### swift-concurrency-expert
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** Swift 6.2+ concurrency review and remediation

Provides targeted fixes for Swift concurrency issues with minimal behavior changes:
- Actor isolation diagnostics
- `@MainActor` annotation guidance
- `Sendable` conformance patterns
- Data-race safety improvements

#### swift-concurrency-avdlee
**Source:** [AvdLee/Swift-Concurrency-Agent-Skill](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill)  
**Focus:** Comprehensive Swift concurrency education and guidance

Expert-level guidance on modern Swift concurrency:
- async/await patterns and structured concurrency
- Actors and @MainActor for data-race safety
- Tasks & task groups for parallel operations
- Swift 6 migration strategies
- Core Data, testing, and performance integration

**Note:** Both concurrency skills are included as they serve different purposes. Use `swift-concurrency-expert` for quick fixes and reviews, and `swift-concurrency-avdlee` for in-depth learning and architecture decisions.

### iOS Development (3 skills)

#### ios-debugger-agent
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Integrates with:** iOS Dev MCP Server tools

End-to-end iOS app debugging workflow using this MCP server:
- Build and run apps on simulator
- UI inspection and interaction
- Log capture and analysis
- Screenshot-driven debugging

**Perfect pairing** with this MCP server's 17 simulator tools!

#### app-store-changelog
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** Release notes generation

Creates user-facing App Store changelogs from git history:
- Filters user-visible changes from technical work
- Organizes into Features/Improvements/Fixes
- Benefit-driven language for end users
- Respects App Store character limits

#### gh-issue-fix-flow
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** GitHub issue resolution workflow

Systematic approach to fixing GitHub issues:
- Issue retrieval and analysis
- Code location with ripgrep
- Minimal focused implementations
- Build, test, commit, and reporting

### SwiftUI (4 skills)

#### swiftui-ui-patterns
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** SwiftUI best practices and patterns

Example-driven guidance for SwiftUI development:
- Modern state management (`@State`, `@Observable`, `@Environment`)
- View composition and data flow
- Sheet patterns and navigation structure
- App scaffolding templates

#### swiftui-view-refactor
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** View structure and consistency

Standardizes SwiftUI views for maintainability:
- Consistent view structure ordering
- MV (Model-View) patterns without unnecessary ViewModels
- Proper Observation usage
- Large file organization strategies

#### swiftui-performance-audit
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** Performance optimization

Diagnoses and fixes SwiftUI performance issues:
- View invalidation storm detection
- List identity stability
- Body computation optimization
- Layout thrash identification
- Instruments profiling guidance

#### swiftui-liquid-glass
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** iOS 26+ Liquid Glass API

Implements modern SwiftUI glass effects:
- Native `glassEffect` API usage
- Proper availability handling
- Fallback UI patterns
- Modifier ordering best practices

### macOS Packaging (1 skill)

#### macos-spm-app-packaging
**Source:** [Dimillian/Skills](https://github.com/Dimillian/Skills)  
**Focus:** SwiftPM-based macOS app distribution

Complete macOS app packaging workflow without Xcode:
- SwiftPM project setup
- Build and bundle scripts
- Code signing and notarization
- Sparkle update integration

## Skill Categories Quick Reference

| Category | Skills | Primary Use Case |
|----------|--------|------------------|
| **Swift Concurrency** | `swift-concurrency-expert`, `swift-concurrency-avdlee` | Safe concurrent code, Swift 6 migration |
| **iOS Development** | `ios-debugger-agent`, `app-store-changelog`, `gh-issue-fix-flow` | Debugging, releases, issue resolution |
| **SwiftUI** | `swiftui-ui-patterns`, `swiftui-view-refactor`, `swiftui-performance-audit`, `swiftui-liquid-glass` | UI development, performance, modern APIs |
| **Packaging** | `macos-spm-app-packaging` | macOS app distribution |

## Using Skills with This MCP Server

These skills are designed to work with the iOS Dev MCP Server's 17 simulator tools. Here are some powerful combinations:

### Debugging Workflow
```
Skill: ios-debugger-agent
Tools: simulator_boot, simulator_install_app, simulator_launch_app,
       simulator_screenshot, simulator_get_logs, simulator_tap

Flow: Boot → Install → Launch → Screenshot → Interact → Analyze logs
```

### Test-Driven Development
```
Skill: /test-driven-development (Claude Code built-in)
Tools: simulator_install_app, simulator_launch_app, simulator_get_logs

Flow: Write test → Build → Install → Run → Verify logs → Iterate
```

### UI Issue Investigation
```
Skill: /systematic-debugging (Claude Code built-in)
Tools: simulator_screenshot, simulator_tap, simulator_swipe,
       simulator_type_text, simulator_get_logs

Flow: Capture state → Reproduce → Screenshot → Logs → Fix → Verify
```

## Skill Attribution

All skills in this directory are sourced from open-source repositories:

- **9 skills** from [Dimillian/Skills](https://github.com/Dimillian/Skills) (MIT License)
- **1 skill** from [AvdLee/Swift-Concurrency-Agent-Skill](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill) (MIT License)

### Original Authors

- **Thomas Ricouard (Dimillian)** - iOS developer, creator of Ice Cubes for Mastodon
- **Antoine van der Lee (AvdLee)** - Swift Concurrency expert, creator of Swift Concurrency Course

### License

These skills are distributed under their original MIT licenses. See individual skill directories for specific license files. This repository includes them for convenience and proper integration with the iOS Dev MCP Server.

### Contributing Improvements

If you make improvements to these skills:
1. Consider contributing back to the original repositories
2. Keep this collection in sync with upstream changes
3. Document any MCP-specific customizations

## Official Apple Documentation

This repository includes **21 official Apple documentation files** from Xcode 26, providing authoritative guidance on iOS 26, macOS 15, and Swift 6.2 features. These docs have been integrated into relevant skills:

**Enhanced Skills with Apple Docs:**
- `swift-concurrency-expert` + `swift-concurrency-avdlee` - Includes Swift 6.2 Concurrency Updates
- `swiftui-liquid-glass` - Includes SwiftUI, AppKit, UIKit, and WidgetKit Liquid Glass guides
- `swiftui-ui-patterns` - Includes WebKit Integration, Styled Text Editing, Toolbar Features, AlarmKit Integration

**Full Apple Documentation Library:**
All 21 Apple documentation files are available in `apple-documentation/` including:
- App Intents, SwiftData, Foundation updates
- On-device LLM integration, Visual Intelligence
- Swift Charts 3D, MapKit toolbox, StoreKit updates
- Accessibility features, visionOS widgets

See [apple-documentation/README.md](apple-documentation/README.md) for the complete catalog.

## Learning Resources

To enhance your understanding of the concepts covered by these skills:

- **Swift Concurrency:** [fuckingapproachableswiftconcurrency.com](https://fuckingapproachableswiftconcurrency.com/en/)
- **Official Apple Docs:** See `apple-documentation/` directory for 21 Xcode 26 documentation files
- **SwiftUI Patterns:** Official Apple SwiftUI tutorials and the included Apple documentation
- **Claude Code Skills:** Use `/using-superpowers` in Claude Code

## Feedback & Updates

For issues or suggestions related to:
- **Specific skills:** Report to the original skill repositories (links above)
- **MCP integration:** Report to [ios-dev-mcp-server issues](https://github.com/yourusername/ios-dev-mcp-server/issues)
- **Missing skills:** Suggest new skills via issues with links to skill repositories

---

**Last Updated:** 2026-01-18  
**Skill Count:** 11 skills across 5 categories
