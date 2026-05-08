# ENGINEERING_RULES.md

# Important Engineering Rules

## Critical Rules

- Do not break authentication.
- Do not break billing.
- Do not break workspace invite flows.
- Do not break onboarding.
- Do not break analytics.
- Do not break existing AI systems.
- Do not rewrite large files unnecessarily.
- Prefer small safe changes.
- Preserve working functionality.

---

# Architecture Rules

## Backend
- Reuse existing services/helpers whenever possible.
- Avoid duplicate OpenAI integrations.
- Keep endpoints lightweight.
- Use structured JSON responses.
- Keep controllers modular.
- Preserve auth middleware patterns.

## Frontend
- Reuse existing dashboard/premium styling.
- Maintain responsive design.
- Avoid unnecessary UI rewrites.
- Preserve existing component hierarchy.
- Keep state management simple and localized.

---

# AI Integration Rules

## OpenAI Usage
- Use existing OpenAI service/helpers.
- Keep prompts concise.
- Limit token usage.
- Avoid huge prompts.
- Avoid analyzing excessive note counts.
- Add graceful fallback handling.
- Never expose raw OpenAI errors to frontend.

## Error Handling
Always:
- return safe JSON
- log server-side errors safely
- provide fallback UI states
- handle invalid AI responses

---

# API Rules

## Protected Routes
All AI/productivity routes must:
- use authenticated users
- respect workspace permissions
- enforce ownership rules

## Response Standards
Responses should:
- remain structured
- avoid breaking frontend contracts
- preserve backward compatibility

---

# Database Rules

- Preserve existing schemas unless necessary.
- Avoid destructive migrations.
- Prefer additive changes.
- Keep meeting intelligence modular.
- Do not remove fields without confirmation.

---

# Frontend Safety Rules

Before modifying:
- DashboardPage.jsx
- NoteForm.jsx
- NoteList.jsx
- AuthContext.jsx
- http.js

Use minimal edits only.

These files are core workflow files.

---

# Billing Safety

Never modify:
- Stripe webhook handling
- billing middleware
- subscription checks
- usage limit enforcement

without explicit instruction.

---

# AI Feature Development Pattern

Always build in this order:

1. Backend skeleton
2. Frontend UI
3. Real AI integration
4. Persistence
5. Optimization

Never attempt all layers simultaneously.

---

# Git Workflow

Preferred workflow:

1. Small isolated feature
2. Local testing
3. Lint/build
4. Commit
5. Push

Commit often.

---

# Build & Validation

Always run:

## Backend
```bash
npm run lint