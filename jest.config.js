/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '\\.css$': '<rootDir>/test/style-mock.js',
        '\\.svg$': '<rootDir>/test/svg-mock.tsx',
        '^@gorhom/bottom-sheet$': '<rootDir>/test/bottom-sheet-mock.js',
        '^react-native-reanimated$': '<rootDir>/test/reanimated-mock.js',
        '^react-native-safe-area-context$': '<rootDir>/test/safe-area-context-mock.js',
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
    ],
};
