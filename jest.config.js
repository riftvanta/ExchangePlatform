module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/server/tests/globalSetup.ts', // Path to setup file
  globalTeardown: '<rootDir>/server/tests/globalTeardown.ts', // Path to teardown file
  testTimeout: 10000, // Increase timeout
  verbose: true, // More detailed output
}; 