import dotenv from "dotenv";

dotenv.config();

const placeholderValues = new Set([
  "replace-with-a-long-random-access-secret",
  "replace-with-a-long-random-refresh-secret",
  "sk_replace_me",
  "sk_test_replace_me",
  "price_replace_me",
  "whsec_replace_me",
  "re_replace_me"
]);

const checks = [];

const value = (key) => process.env[key] || "";
const present = (key) => Boolean(value(key));
const isPlaceholder = (key) => placeholderValues.has(value(key));
const isHttpsUrl = (key) => /^https:\/\/[^/\s]+/i.test(value(key));
const hasLocalhost = (key) => /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(value(key));

function addCheck(level, label, passed, help) {
  checks.push({ level, label, passed, help });
}

function requirePresent(key) {
  addCheck("error", `${key} is set`, present(key), `Set ${key} in Render or your production environment.`);
}

function requireNotPlaceholder(key) {
  addCheck("error", `${key} is not a placeholder`, present(key) && !isPlaceholder(key), `Replace the example value for ${key}.`);
}

function recommendPresent(key, help) {
  addCheck("warn", `${key} is set`, present(key), help);
}

requirePresent("MONGODB_URI");
requirePresent("JWT_ACCESS_SECRET");
requirePresent("JWT_REFRESH_SECRET");
requireNotPlaceholder("JWT_ACCESS_SECRET");
requireNotPlaceholder("JWT_REFRESH_SECRET");

addCheck(
  "error",
  "JWT_ACCESS_SECRET is at least 32 characters",
  value("JWT_ACCESS_SECRET").length >= 32,
  "Use a unique long random access-token secret."
);
addCheck(
  "error",
  "JWT_REFRESH_SECRET is at least 32 characters",
  value("JWT_REFRESH_SECRET").length >= 32,
  "Use a unique long random refresh-token secret."
);
addCheck("error", "COOKIE_SECURE is true", value("COOKIE_SECURE") === "true", "Set COOKIE_SECURE=true for HTTPS production.");
addCheck("error", "CLIENT_ORIGIN is HTTPS", isHttpsUrl("CLIENT_ORIGIN"), "Set CLIENT_ORIGIN to the exact Netlify production URL.");
addCheck("error", "CLIENT_ORIGIN is not localhost", present("CLIENT_ORIGIN") && !hasLocalhost("CLIENT_ORIGIN"), "Do not use localhost in production CLIENT_ORIGIN.");

const stripeKeys = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"];
const configuredStripeKeys = stripeKeys.filter((key) => present(key));
addCheck(
  "error",
  "Stripe config is complete or fully disabled",
  configuredStripeKeys.length === 0 || configuredStripeKeys.length === stripeKeys.length,
  "Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and STRIPE_WEBHOOK_SECRET together."
);
for (const key of stripeKeys) {
  if (present(key)) {
    requireNotPlaceholder(key);
  }
}

recommendPresent("OPENAI_API_KEY", "Set OPENAI_API_KEY if AI features should work in production.");
if (present("OPENAI_API_KEY")) {
  requireNotPlaceholder("OPENAI_API_KEY");
}
recommendPresent("OPENAI_MODEL", "Set OPENAI_MODEL explicitly so AI behavior is predictable.");

const emailKeys = ["RESEND_API_KEY", "EMAIL_FROM"];
const configuredEmailKeys = emailKeys.filter((key) => present(key));
addCheck(
  "warn",
  "Resend email config is complete or fully disabled",
  configuredEmailKeys.length === 0 || configuredEmailKeys.length === emailKeys.length,
  "Set RESEND_API_KEY and EMAIL_FROM together for transactional emails."
);
for (const key of emailKeys) {
  if (present(key)) {
    requireNotPlaceholder(key);
  }
}

addCheck(
  "error",
  "ENABLE_DEBUG_ROUTES is not true",
  value("ENABLE_DEBUG_ROUTES") !== "true",
  "Disable temporary debug routes in production."
);
recommendPresent("VITE_API_BASE_URL", "Set VITE_API_BASE_URL in Netlify to the Render backend URL.");
if (present("VITE_API_BASE_URL")) {
  addCheck("error", "VITE_API_BASE_URL is HTTPS", isHttpsUrl("VITE_API_BASE_URL"), "Netlify VITE_API_BASE_URL should point to the HTTPS Render URL.");
  addCheck("error", "VITE_API_BASE_URL is not localhost", !hasLocalhost("VITE_API_BASE_URL"), "Do not use localhost in production VITE_API_BASE_URL.");
}
recommendPresent("VITE_SUPPORT_EMAIL", "Set VITE_SUPPORT_EMAIL in Netlify to the public support inbox.");

const failures = checks.filter((check) => check.level === "error" && !check.passed);
const warnings = checks.filter((check) => check.level === "warn" && !check.passed);

for (const check of checks) {
  const icon = check.passed ? "PASS" : check.level === "error" ? "FAIL" : "WARN";
  console.log(`${icon}: ${check.label}`);
  if (!check.passed) {
    console.log(`  ${check.help}`);
  }
}

console.log("");
console.log(`Production env check complete: ${failures.length} failure(s), ${warnings.length} warning(s).`);

if (failures.length) {
  process.exitCode = 1;
}
