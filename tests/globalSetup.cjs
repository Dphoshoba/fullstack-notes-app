const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

module.exports = async () => {
  // Set test environment variables BEFORE any modules are loaded
  process.env.NODE_ENV = "test";
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

  // In CI, use a hosted MongoDB service (faster + more reliable than
  // downloading a binary). Locally, fall back to the in-memory server.
  if (process.env.CI_MONGODB_URI) {
    const uri = process.env.CI_MONGODB_URI;
    process.env.MONGODB_URI = uri;
    global.__MONGO_URI__ = uri;
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018
    }
  });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  global.__MONGO_SERVER__ = mongoServer;
  global.__MONGO_URI__ = uri;
};
