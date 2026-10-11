process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/express_auth_api_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-very-long-for-testing-purposes-32chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-very-long-for-testing-purposes-32chars";
process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";
process.env.CLIENT_ORIGIN = "http://localhost:3000";
process.env.COOKIE_SECURE = "false";
process.env.OPENAI_API_KEY = "sk-test-key-for-testing-only";
process.env.OPENAI_MODEL = "gpt-4o-mini";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_PRICE_ID = "price_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.RESEND_API_KEY = "re_test";
process.env.EMAIL_FROM = "Test <no-reply@test.com>";

module.exports = {
  testEnvironment: "node",
  maxWorkers: 1,
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.js", "**/*.spec.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/scripts/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  },
  transform: {},
  transformIgnorePatterns: [
    "node_modules/(?!(nanoid|@babel|resend|stripe|openai|http-status-codes))"
  ],
  globalSetup: "<rootDir>/tests/globalSetup.cjs",
  globalTeardown: "<rootDir>/tests/globalTeardown.cjs"
};
