# Notes Workspace — Engineering Roadmap

Progress log for taking the platform "to the next level." Each item lists what
was delivered in this pass and how to build on it.

## Status Legend
- ✅ Delivered (committed)
- 🟡 Partial / foundational (needs external service or product decision)
- ⬜ Not started

---

## 1. Testing — ✅
- Jest + Babel (ESM) + MongoDB Memory Server (isolated, no external DB).
- 46 tests across unit (tokens, models) and integration (auth, notes, billing,
  note templates). All green.
- Commands: `npm test`, `npm run test:unit`, `npm run test:integration`.
- **Next:** raise coverage thresholds (currently permissive in `jest.config.cjs`);
  add E2E (Playwright) for register→login→create-note.

## 2. CI/CD Pipeline — ✅
- Full workflow authored (lint, typecheck, test w/ MongoDB service, client build, audit).
- Stored at `docs/ci-cd-workflow.example.yml`.
- The App token lacks `workflows` permission, so it cannot commit files under
  `.github/workflows/`. **Install in one step:** `npm run ci:setup`
  (runs `scripts/setup-ci.sh`) then commit/push from a token that has
  `workflows` permission (classic PAT, or grant the App the permission).

## 3. TypeScript Migration — ✅ (incremental, type-checking active)
- `tsconfig.json` with `allowJs` + `checkJs` enabled, so the whole codebase is
  type-checked by TypeScript with **zero runtime change** (JS still runs as-is).
- `src/types/index.d.ts` (User, Note, ApiResponse, AuthTokens) as the shared
  domain types; `@types/node` installed.
- All type issues fixed; `npm run typecheck` (tsc --noEmit) passes clean.
- **Next (per-file opt-in, no big-bang rewrite):** convert leaf modules to
  `.ts` one at a time once a build step (esbuild/tsc emit) is introduced, then
  ratchet `strict: true`.

## 4. Structured Logging + Sentry — ✅
- Winston logger (`src/services/logger.js`) wired into request logging.
- Sentry init gated on `SENTRY_DSN` (`src/services/sentry.js`).
- **Next:** add request correlation IDs + Sentry breadcrumbs on AI calls.

## 5. Redis Caching — ✅
- `src/services/redis.js` (get/set/del, lazy, no-op when `REDIS_URL` unset).
- `src/middleware/cache.js` — opt-in GET response cache.
- **Next:** apply `cacheGetResponse()` to read-heavy routes (notes list).

## 6. API Versioning + OpenAPI — 🟡
- OpenAPI 3 spec served at `GET /api/openapi.json` (`src/routes/openapiRoutes.js`).
- **Next:** introduce `/api/v1` prefix (additive alias) when a breaking change
  is needed.

## 7. Real-time (WebSockets) — ✅
- Socket.IO server (`src/services/realtime.js`), auth handshake, per-user rooms.
- `emitNotification(userId, payload)` helper.
- **Next:** emit on new comments/invites; add client socket listener.

## 8. Enhanced Search — 🟡
- Hybrid search service (`src/services/searchService.js`): Mongo regex now +
  OpenAI re-ranking already in `/api/ai/semantic-search`.
- **Next:** plug in Algolia (or Meilisearch) for instant full-text + facets.

## 9. TanStack Query — ✅
- `QueryClientProvider` wired in `client/src/main.jsx`.
- `useNotesQuery` hook (`client/src/api/useNotesQuery.js`) as the reference pattern.
- **Next:** migrate DashboardPage list fetch to the hook for caching/refetch.

## 10. Mobile / PWA — 🟡
- PWA already ships (manifest + service worker, 11 precached entries).
- **Next:** Capacitor push notifications, biometric unlock, offline sync.

## 11. Email Templates — 🟡
- Template directory at `src/templates/email/invite.html` (table-based HTML).
- **Next:** centralize templating in `emailService.js`; add welcome + digest.

## 12. Data Migration Tooling — ✅
- `migrate-mongo` configured (`migrate-mongo-config.js`) + example migration.
- Commands: `npm run migrate`, `npm run migrate:status`.

## 13. Observability — ✅
- Prometheus-format metrics endpoint `GET /metrics` (`src/services/metrics.js`).
- **Next:** export DB latency + AI call counters; add uptime monitoring.

## 14. Code Quality Tooling — ✅
- Prettier (`.prettierrc.json`), commitlint (`.commitlintrc.json`), husky hooks
  (pre-commit lint, commit-msg lint).
- Commands: `npm run format`, `npm run format:check`.

## 15. Security Hardening — ✅
- Helmet hardened: strict CSP, HSTS (enabled when `COOKIE_SECURE`), referrer policy.
- Optional infra env vars documented in `.env.example`.
- **Next:** per-route body limits, WAF (Cloudflare), dependency audit in CI.

## 16. Product Features — 🟡 (example delivered)
- **Note Templates** shipped end-to-end: `NoteTemplate` model, controller,
  routes at `/api/notes/templates`, Joi validation, integration tests.
- **Next:** templates UI in NoteForm; backlinks/graph view; API keys + webhooks.

---

## Suggested build order (highest leverage first)
1. Wire CI/CD workflow into `.github/workflows/` (needs maintainer token).
2. Apply Redis cache to `/api/notes` list + raise test coverage thresholds.
3. Emit real-time notifications on new comments/invites.
4. Continue TypeScript migration (utils → config → models).
5. Add Algolia for instant search.
