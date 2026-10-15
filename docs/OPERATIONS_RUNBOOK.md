# Operations Runbook

Use this guide when checking production health or investigating a user report.

## Quick Health Check

1. Open the production frontend:

```text
https://notes-app-multilingual.netlify.app/
```

2. Check the backend health endpoint:

```text
https://fullstack-notes-app-b61v.onrender.com/api/health
```

Expected response:

```json
{
  "success": true,
  "status": "ok",
  "database": "connected"
}
```

3. Check a direct frontend route:

```text
https://notes-app-multilingual.netlify.app/settings
```

Expected result: the React app loads, not a Netlify `404`.

## Production Logs

### Render

Use Render logs for:

- API startup failures
- MongoDB connection issues
- OpenAI request failures
- Resend email warnings
- Stripe webhook errors
- Repeated `401`, `400`, `429`, or `500` responses

Useful searches:

- `Failed to start server`
- `MongoDB connected`
- `AI`
- `Transactional email could not be sent`
- `Workspace invite email could not be sent`
- `Stripe`
- `401`
- `429`
- `500`

### Netlify

Use Netlify deploy logs for:

- Build failures
- Wrong environment variables
- Missing `_redirects`
- Stale deploys

Check that:

- Build command is `npm run build`.
- Publish directory is `client/dist`.
- `VITE_API_BASE_URL` points to the Render backend.

## Metrics And Analytics

The backend exposes lightweight request metrics:

```text
https://fullstack-notes-app-b61v.onrender.com/metrics
```

The app also stores first-party analytics events in MongoDB. Admin and superadmin users can view a summary in the Admin modal.

Use analytics to check:

- Landing page views
- Register clicks
- Login clicks
- Upgrade clicks
- Most common app paths
- Total users
- Total notes
- Invites sent and accepted
- AI usage count

Do not store sensitive values in analytics metadata.

## Error Reporting

If `SENTRY_DSN` is configured, server-side `500` errors are sent to Sentry from the central error handler.

Sentry should be used for:

- Unhandled backend exceptions
- Unexpected production `500` responses
- Error frequency after a release

Sentry should not receive:

- API keys
- JWTs
- Passwords
- Payment details
- Raw cookies

## Common Issues

### User Sees `Please log in again`

Likely causes:

- Access token expired and refresh token is invalid or blocked.
- User logged out in another tab.
- Browser blocked third-party cookies.
- Backend `COOKIE_SECURE` or `CLIENT_ORIGIN` is wrong.

Check:

- Render `CLIENT_ORIGIN`
- Render `COOKIE_SECURE=true`
- Netlify `VITE_API_BASE_URL`
- Browser Network tab for `/api/auth/refresh`

### User Sees Connection Failed

Likely causes:

- Phone is offline or has weak network.
- Render backend is asleep and slow to wake.
- CORS origin mismatch.
- Backend deploy failed.

Check:

- `/api/health`
- Render service status
- CORS preflight in browser Network tab
- Netlify production URL vs backend `CLIENT_ORIGIN`

### Invite Link Created But Email Not Sent

Likely causes:

- `RESEND_API_KEY` missing or invalid.
- `EMAIL_FROM` domain is not verified.
- Resend delivery blocked or bounced.

Check:

- Render logs for `Workspace invite email could not be sent`
- Resend dashboard
- `EMAIL_FROM`
- Recipient address

Invite creation should still return an invite link even if email fails.

### AI Service Unavailable

Likely causes:

- `OPENAI_API_KEY` missing or invalid.
- OpenAI request failed.
- User reached AI usage limit.
- Backend timeout or Render cold start.

Check:

- Render logs for AI errors
- `OPENAI_API_KEY`
- User plan and AI usage count
- `/api/health`

### Direct URL Returns 404

Likely cause:

- Netlify SPA fallback missing or not deployed.

Check:

- `client/public/_redirects`
- Netlify deploy output includes `_redirects`
- Direct route such as `/settings` returns `200`

## Release Checklist

Before a production release:

1. Run backend lint.
2. Run backend typecheck.
3. Run backend audit.
4. Run client lint.
5. Run client build.
6. Run client audit.
7. Check `/api/health`.
8. Check production CORS preflight if auth fails.
9. Complete `docs/MOBILE_STABILITY_CHECKLIST.md`.
10. Tag a stable checkpoint when the release passes.

## Emergency Rollback

If a new release breaks production and a quick fix is not obvious:

1. Identify the last stable tag, for example `v0.1.0-stable-mobile`.
2. Compare the current branch against the tag:

```bash
git diff v0.1.0-stable-mobile..main
```

3. Revert the problematic commit or redeploy the last known-good commit.
4. Verify `/api/health`, login, notes, workspaces, and mobile navigation.
