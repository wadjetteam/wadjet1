/**
 * Root Jest configuration for WADJET GRC
 *
 * Two projects:
 *   unit        — Pure math / logic tests (Eq 1-10). Mocks SQLite DB.
 *   integration — API endpoint tests. Uses real SQLite DB.
 */
const config = {
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      preset: "ts-jest/presets/default-esm",
      testEnvironment: "node",
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^@workspace/db$": "<rootDir>/backend/packages/db/src/index.ts",
        "^@workspace/db/(.*)$": "<rootDir>/backend/packages/db/src/$1",
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true,
            tsconfig: "tsconfig.base.json",
          },
        ],
      },
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
      preset: "ts-jest/presets/default-esm",
      testEnvironment: "node",
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^@workspace/db$": "<rootDir>/backend/packages/db/src/index.ts",
        "^@workspace/db/(.*)$": "<rootDir>/backend/packages/db/src/$1",
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true,
            tsconfig: "tsconfig.base.json",
          },
        ],
      },
    },
  ],
};

export default config;
