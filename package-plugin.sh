#!/bin/bash

# Package iOS Development Tools plugin for marketplace distribution
set -e

echo "📦 iOS Development Tools - Plugin Packaging"
echo "==========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VERSION=$(node -p "require('./plugin.json').version")
PACKAGE_NAME="ios-dev-v${VERSION}.zip"

echo "Version: $VERSION"
echo "Package: $PACKAGE_NAME"
echo ""

# Pre-flight checks
echo "🔍 Running pre-flight checks..."

# Check if build exists
if [ ! -d "$SCRIPT_DIR/build" ]; then
    echo "❌ Build directory not found. Running npm run build..."
    npm run build
fi

# Check if assets exist
if [ ! -f "$SCRIPT_DIR/assets/icon.png" ]; then
    echo "⚠️  Warning: assets/icon.png not found"
    echo "   Create a 512x512 PNG icon before publishing"
fi

if [ ! -f "$SCRIPT_DIR/assets/screenshot-1.png" ]; then
    echo "⚠️  Warning: assets/screenshot-1.png not found"
    echo "   Create screenshots before publishing"
fi

# Check required files
REQUIRED_FILES=(
    "plugin.json"
    "package.json"
    "README.md"
    "CHANGELOG.md"
    "LICENSE"
    "build/index.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"
echo ""

# Create package directory
echo "📁 Creating package directory..."
PACKAGE_DIR="$SCRIPT_DIR/dist/ios-dev-plugin"
rm -rf "$SCRIPT_DIR/dist"
mkdir -p "$PACKAGE_DIR"

# Copy files to package directory
echo "📋 Copying files..."

# Core files
cp -r "$SCRIPT_DIR/build" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/plugin.json" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/package.json" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/README.md" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/CHANGELOG.md" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/LICENSE" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/QUICKSTART.md" "$PACKAGE_DIR/"

# Assets (if they exist)
if [ -d "$SCRIPT_DIR/assets" ]; then
    mkdir -p "$PACKAGE_DIR/assets"
    cp -r "$SCRIPT_DIR/assets"/* "$PACKAGE_DIR/assets/" 2>/dev/null || true
fi

# node_modules (production only)
echo "📦 Installing production dependencies..."
cd "$PACKAGE_DIR"
npm install --production --silent

# Create archive
echo "🗜️  Creating archive..."
cd "$SCRIPT_DIR/dist"
zip -r "$PACKAGE_NAME" ios-dev-plugin -q

PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Package created successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Package: dist/$PACKAGE_NAME"
echo "📊 Size: $PACKAGE_SIZE"
echo ""
echo "📋 Contents:"
ls -lh "$SCRIPT_DIR/dist/$PACKAGE_NAME"
echo ""
echo "🔍 Verify package contents:"
echo "   unzip -l dist/$PACKAGE_NAME | less"
echo ""
echo "📤 Ready to upload to Claude Code Plugin Marketplace!"
echo ""

# Checklist
echo "📝 Pre-publication checklist:"
echo ""
echo "Before publishing, ensure:"
echo "  [ ] Assets created (icon.png, screenshots)"
echo "  [ ] GitHub repository created and pushed"
echo "  [ ] Version tagged (git tag v$VERSION)"
echo "  [ ] CHANGELOG.md updated"
echo "  [ ] All tools tested"
echo "  [ ] Documentation reviewed"
echo ""
echo "Next steps:"
echo "1. Review: unzip -l dist/$PACKAGE_NAME"
echo "2. Test: Extract and test locally"
echo "3. Publish: Follow MARKETPLACE_PUBLISHING.md"
echo ""
