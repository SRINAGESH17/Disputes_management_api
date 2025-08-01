/** @type {import('ts-jest').JestConfigWithTsJest} **/

export default {
    setupFilesAfterEnv: ['<rootDir>/test/setup.test.js'],
    testMatch: ['<rootDir>/test/**/*.test.js'],
    testEnvironment: 'node',
    verbose: true,
    //     testNamePattern: '.*', // Matches all test names/descriptions
};