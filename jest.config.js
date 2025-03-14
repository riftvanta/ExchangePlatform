/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/tests', '<rootDir>/server'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/server/tests/globalSetup.ts', // Path to setup file
  globalTeardown: '<rootDir>/server/tests/globalTeardown.ts', // Path to teardown file
  testTimeout: 10000, // Increase timeout
  verbose: true, // More detailed output
}; 