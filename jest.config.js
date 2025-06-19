// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // specify a custom tsconfig file for jest
      tsconfig: 'tsconfig.test.json'
    }],
  },
  reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: './reports/junit',
      outputName: 'results.xml'
    }]
  ],
  coverageDirectory: 'reports/coverage',
  collectCoverage: true
};