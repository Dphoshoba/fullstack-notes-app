// This file must be loaded BEFORE any src modules are imported
// It sets all required environment variables for testing

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
