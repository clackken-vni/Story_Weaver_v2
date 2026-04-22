module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!**/*.test.ts',
    '!**/*.test.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 75,
      functions: 95,
      lines: 95,
    },
  },
};
