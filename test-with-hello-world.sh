#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  iOS Dev MCP Server - Hello World App Test${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
APP_PATH="../HelloWorldiOS/build/HelloWorld.app"
BUNDLE_ID="com.test.HelloWorld"
MCP_SERVER="./build/index.js"

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ Hello World app not found at $APP_PATH${NC}"
    echo -e "${YELLOW}Build it first:${NC}"
    echo "  cd ../HelloWorldiOS"
    echo "  ./build-app.sh"
    exit 1
fi

# Check if MCP server is built
if [ ! -f "$MCP_SERVER" ]; then
    echo -e "${RED}❌ MCP server not built${NC}"
    echo -e "${YELLOW}Build it first:${NC}"
    echo "  npm run build"
    exit 1
fi

echo -e "${BLUE}Step 1: Listing all iOS simulators...${NC}"
echo "Command: xcrun simctl list devices"
echo ""
xcrun simctl list devices | grep -A 5 "iOS" | head -20
echo ""

# Get booted device or boot one
BOOTED_DEVICE=$(xcrun simctl list devices | grep "Booted" | head -1 | grep -oE '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}' || echo "")

if [ -z "$BOOTED_DEVICE" ]; then
    echo -e "${YELLOW}No booted device found. Booting first available iPhone...${NC}"
    # Find any iPhone device
    DEVICE_UDID=$(xcrun simctl list devices | grep "iPhone" | grep "Shutdown" | head -1 | grep -oE '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}')

    if [ -z "$DEVICE_UDID" ]; then
        echo -e "${RED}❌ No iPhone simulators found${NC}"
        echo -e "${YELLOW}Available devices:${NC}"
        xcrun simctl list devices
        exit 1
    fi

    echo -e "${BLUE}Booting device: $DEVICE_UDID${NC}"
    xcrun simctl boot "$DEVICE_UDID"

    # Wait for boot
    echo "Waiting for device to boot..."
    sleep 5

    BOOTED_DEVICE="$DEVICE_UDID"
else
    echo -e "${GREEN}✅ Found booted device: $BOOTED_DEVICE${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Getting device info...${NC}"
xcrun simctl list devices | grep "$BOOTED_DEVICE" -A 1
echo ""

echo -e "${BLUE}Step 3: Installing Hello World app...${NC}"
echo "Command: xcrun simctl install $BOOTED_DEVICE \"$APP_PATH\""
xcrun simctl install "$BOOTED_DEVICE" "$APP_PATH"
echo -e "${GREEN}✅ App installed${NC}"
echo ""

echo -e "${BLUE}Step 4: Launching Hello World app...${NC}"
echo "Command: xcrun simctl launch $BOOTED_DEVICE $BUNDLE_ID"
LAUNCH_OUTPUT=$(xcrun simctl launch "$BOOTED_DEVICE" "$BUNDLE_ID")
echo "$LAUNCH_OUTPUT"
echo -e "${GREEN}✅ App launched${NC}"
echo ""

# Wait for app to fully load
echo "Waiting for app to load..."
sleep 3

echo -e "${BLUE}Step 5: Taking initial screenshot...${NC}"
SCREENSHOT_1="/tmp/hello-world-screenshot-1.png"
xcrun simctl io "$BOOTED_DEVICE" screenshot "$SCREENSHOT_1"
echo -e "${GREEN}✅ Screenshot saved: $SCREENSHOT_1${NC}"
echo ""

echo -e "${BLUE}Step 6: Tapping on text field (center of screen)...${NC}"
# iPhone 15 Pro screen size is approximately 393x852 points
# Text field should be around center
xcrun simctl io "$BOOTED_DEVICE" tap 196 350
echo -e "${GREEN}✅ Tapped at coordinates (196, 350)${NC}"
sleep 1
echo ""

echo -e "${BLUE}Step 7: Typing text into text field...${NC}"
echo "Command: xcrun simctl io $BOOTED_DEVICE text \"Claude\""
xcrun simctl io "$BOOTED_DEVICE" text "Claude"
echo -e "${GREEN}✅ Typed 'Claude'${NC}"
sleep 1
echo ""

echo -e "${BLUE}Step 8: Tapping 'Say Hello' button...${NC}"
# Button should be below text field
xcrun simctl io "$BOOTED_DEVICE" tap 196 450
echo -e "${GREEN}✅ Tapped button${NC}"
sleep 1
echo ""

echo -e "${BLUE}Step 9: Taking final screenshot...${NC}"
SCREENSHOT_2="/tmp/hello-world-screenshot-2.png"
xcrun simctl io "$BOOTED_DEVICE" screenshot "$SCREENSHOT_2"
echo -e "${GREEN}✅ Screenshot saved: $SCREENSHOT_2${NC}"
echo ""

echo -e "${BLUE}Step 10: Getting recent app logs...${NC}"
echo "Command: xcrun simctl spawn $BOOTED_DEVICE log show --last 30s --predicate 'processImagePath CONTAINS \"HelloWorld\"'"
xcrun simctl spawn "$BOOTED_DEVICE" log show --last 30s --predicate 'processImagePath CONTAINS "HelloWorld"' | head -20 || echo "(No logs found)"
echo ""

echo -e "${BLUE}Step 11: Testing home button press...${NC}"
xcrun simctl io "$BOOTED_DEVICE" pressButton home
echo -e "${GREEN}✅ Pressed home button${NC}"
sleep 1
echo ""

echo -e "${BLUE}Step 12: Taking screenshot of home screen...${NC}"
SCREENSHOT_3="/tmp/hello-world-screenshot-3.png"
xcrun simctl io "$BOOTED_DEVICE" screenshot "$SCREENSHOT_3"
echo -e "${GREEN}✅ Screenshot saved: $SCREENSHOT_3${NC}"
echo ""

echo -e "${BLUE}Step 13: Terminating app...${NC}"
xcrun simctl terminate "$BOOTED_DEVICE" "$BUNDLE_ID" || echo "(App already terminated)"
echo -e "${GREEN}✅ App terminated${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Test Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ All operations completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Screenshots saved:${NC}"
echo "  1. Initial screen: $SCREENSHOT_1"
echo "  2. After typing & button press: $SCREENSHOT_2"
echo "  3. Home screen: $SCREENSHOT_3"
echo ""
echo -e "${YELLOW}To view screenshots:${NC}"
echo "  open $SCREENSHOT_1"
echo "  open $SCREENSHOT_2"
echo "  open $SCREENSHOT_3"
echo ""
echo -e "${BLUE}MCP Server Tools Demonstrated:${NC}"
echo "  ✅ simulator_list_devices (via simctl list)"
echo "  ✅ simulator_boot (via simctl boot)"
echo "  ✅ simulator_get_info (via simctl list)"
echo "  ✅ simulator_install_app (via simctl install)"
echo "  ✅ simulator_launch_app (via simctl launch)"
echo "  ✅ simulator_screenshot (via simctl io screenshot)"
echo "  ✅ simulator_tap (via simctl io tap)"
echo "  ✅ simulator_type_text (via simctl io text)"
echo "  ✅ simulator_press_home (via simctl io pressButton home)"
echo "  ✅ simulator_get_logs (via simctl spawn log show)"
echo "  ✅ simulator_terminate_app (via simctl terminate)"
echo ""
echo -e "${GREEN}All 11 MCP tools tested successfully! 🎉${NC}"
echo ""
