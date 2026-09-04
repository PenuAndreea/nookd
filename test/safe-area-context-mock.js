// A minimal stand-in for react-native-safe-area-context: this app only uses
// useSafeAreaInsets (see src/components/molecules/header.tsx). The vendor's
// own jest/mock.tsx calls jest.requireActual('react-native-safe-area-context')
// internally, which our moduleNameMapper (needed so *named* imports resolve
// at all — see jest.config.js) would redirect right back to itself, so we
// write our own instead of wiring up theirs.
const insets = { top: 0, right: 0, bottom: 0, left: 0 };

module.exports = {
    __esModule: true,
    useSafeAreaInsets: () => insets,
    initialWindowMetrics: { frame: { x: 0, y: 0, width: 320, height: 640 }, insets },
};
