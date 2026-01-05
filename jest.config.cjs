/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["dotenv/config"],
};
