export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'], // keeps Playwright specs in /e2e out of Jest
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } }
        },
        module: { type: 'commonjs' }
      },
    ],
  },
  moduleNameMapper: { '^.+/lib/env$': '<rootDir>/src/test/envStub.ts' },
};
