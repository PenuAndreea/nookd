// @gorhom/bottom-sheet/mock.js is plain CommonJS (`module.exports = {...}`,
// no `__esModule` flag). Babel's default/namespace-import interop wraps a
// non-ES module as `{ default: wholeModule }`, so re-exporting via
// `export { default } from '...'` or `import x from '...'` both hand back
// the *whole* exports object, not the inner `.default` class. Using
// `require()` directly bypasses that interop, so we can pull the real
// pieces out by hand and re-publish them as genuine ES exports.
const mock = require('@gorhom/bottom-sheet/mock');

module.exports = { ...mock, __esModule: true, default: mock.default };
