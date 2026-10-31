export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/helpers/env.js'],
  transform: {}, // plain ES modules: no Babel step
  testTimeout: 30000,
};
