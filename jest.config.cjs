/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+\\.js$": "babel-jest",
    },
    // Transform ESM node_modules that Jest can't handle natively
    transformIgnorePatterns: [
        "/node_modules/(?!(yahoo-finance2)/)",
    ],
    testMatch: ["**/tests/**/*.test.js"],
    verbose: true,
};
