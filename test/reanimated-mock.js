// react-native-reanimated's own `mock.js` re-imports the real package to
// grab shared enum values, which in turn initializes react-native-worklets'
// native module — that throws under Jest (no native bridge). This app only
// renders `Animated.View` (see src/app/(app)/room/[id].tsx), so it's simpler
// to stand in with the plain View than to wire up the real mock's native
// dependency.
const { View } = require('react-native');

module.exports = {
    __esModule: true,
    default: { View },
};
