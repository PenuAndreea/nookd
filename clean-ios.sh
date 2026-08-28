#!/usr/bin/env bash
# clean-rn-ios.sh — clear RN iOS build caches and reinstall pods.
# Run from your project root (folder containing ios/ and package.json).

set -euo pipefail

if [ ! -d "ios" ] || [ ! -f "package.json" ]; then
  echo "Run this from your React Native project root (no ios/ or package.json found here)." >&2
  exit 1
fi

echo "==> Killing Metro / watchman watches"
watchman watch-del-all 2>/dev/null || echo "   (watchman not installed, skipping)"

echo "==> Clearing Xcode DerivedData"
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "==> Clearing ios/build"
rm -rf ios/build

echo "==> Clearing Pods + Podfile.lock"
rm -rf ios/Pods
rm -rf ios/Podfile.lock

echo "==> Cleaning CocoaPods cache"
command -v pod >/dev/null 2>&1 && pod cache clean --all || echo "   (pod not installed, skipping)"

echo "==> Clearing Metro bundler cache"
rm -rf "${TMPDIR:-/tmp}"/metro-* "${TMPDIR:-/tmp}"/haste-map-*

echo "==> Reinstalling pods"
(cd ios && pod install)

echo "==> Done. Start Metro with a reset cache:"
echo "    npx react-native start --reset-cache"