# Release Notes

## v0.1.0-stable-mobile

Tagged: October 16, 2026

This is the first stable mobile baseline for Notes Workspace. It marks the point where the core web app, production deployment, mobile browser usage, and installed PWA flow were tested and working.

### Included Capabilities

- Standard notes with title, body, category, tags, pinning, starring, search, filters, pagination, and note history.
- Action notes with due date, due time, reminder date, priority, and status badges.
- Meeting notes with meeting metadata, meeting summary display, AI meeting actions, and structured export support.
- Comments and attachments on notes, loaded on demand to avoid repeated request loops.
- Workspaces, workspace roles, invitations, invite emails, and manual member management.
- Profile editing, settings, language selection, and default note scope.
- Admin and superadmin panels with user list, role management, and analytics summary.
- OpenAI-powered AI tools for summaries, tag suggestions, meeting minutes, action item extraction, smart suggestions, and dashboard insights.
- Stripe billing flow for Premium upgrades and billing portal access.
- First-party analytics stored in MongoDB.
- Notifications and transactional email support.
- Public landing page with conversion flow.
- React Router SPA fallback for Netlify direct routes.
- PWA install prompt, update prompt, service worker refresh checks, and mobile dashboard bottom navigation.

### Stability Checks Completed

- Netlify production landing page returns `200`.
- Netlify direct routes such as `/settings` and `/invite/:token` return the React app instead of `404`.
- Render backend `/api/health` returns `200` with database connected.
- Production CORS preflight works for login and analytics from the Netlify production origin.
- Service worker is served with `Cache-Control: public, must-revalidate, max-age=0`.
- iPhone and Android mobile smoke tests passed.
- Client lint passed.
- Client production build passed.
- Client audit reported `0 vulnerabilities`.
- Backend lint passed.
- Backend typecheck passed.
- Backend audit reported `0 vulnerabilities`.

### Known Operational Notes

- Chrome extension console messages such as `chrome-extension://invalid` are not app errors.
- Render free instances may sleep and make the first backend request slow.
- Mobile voice input depends on browser/device microphone permission and may require a page refresh after permission changes.
- Keep debug routes disabled in production unless actively troubleshooting.

### Rollback Checkpoint

Use this tag as the known-good baseline:

```bash
git checkout v0.1.0-stable-mobile
```

To compare future changes against this baseline:

```bash
git diff v0.1.0-stable-mobile..main
```
