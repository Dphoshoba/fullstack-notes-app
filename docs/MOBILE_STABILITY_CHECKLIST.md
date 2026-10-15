# Mobile Stability Checklist

Use this checklist before each production release, especially after changes to navigation, authentication, service workers, uploads, voice notes, or workspaces.

## Devices And Browsers

Test at least:

- iPhone Safari
- Android Chrome
- Desktop Chrome or Edge
- Installed PWA, if already installed on the device

## Fresh Load And Update

1. Open the production Netlify URL in a normal browser tab.
2. Refresh once and confirm the app loads without a blank screen.
3. Open the app from the installed PWA icon, if installed.
4. Confirm the PWA update prompt appears after a new deploy when an old version is cached.
5. Tap `Update now` and confirm the app reloads into the latest version.
6. If the app looks stale after a deploy, close and reopen it, then refresh once.

## Auth And Session

1. Log in with a real test account.
2. Visit `Home`, `Notes`, `Calendar`, `Meetings`, `AI Workspace`, `Team`, and `Settings`.
3. Leave the app idle long enough for the access token to expire.
4. Return to the app and confirm protected screens either refresh the session or show `Please log in again.`
5. Log out and confirm protected routes redirect to login.

## Mobile Navigation

1. On a phone-sized screen, confirm the bottom dashboard nav is visible.
2. Tap each bottom nav item and confirm the correct section opens.
3. Confirm the floating create button does not cover the bottom nav.
4. Confirm long labels do not overflow the screen.
5. Rotate the phone and confirm layout remains usable.

## Notes Core Flow

1. Create a standard note.
2. Create a meeting note.
3. Edit title, body, tags, category, pinned, starred, and action-note fields.
4. Delete a test note.
5. Search notes and clear the search.
6. Use filters: pinned, starred, workspace, private, this week, action notes, due today, due this week, overdue, and done.
7. Open a note by tapping the card, not only the edit icon.
8. Open the note title index and confirm it can jump to notes across the full note list.

## Voice Notes

1. Open `Settings`.
2. Run the microphone check.
3. Create a note using `Voice to text`.
4. Confirm the recording starts only after tapping the button.
5. Confirm transcription text is inserted into the note body.
6. If voice fails, confirm the error message is clear and does not expose technical secrets.

## Workspaces

1. Open `Settings`.
2. Confirm the workspace section is reachable on mobile.
3. Create an invite with a test email.
4. Confirm the invite link is shown even if email delivery fails.
5. Copy the invite link.
6. Accept the invite from a second account.
7. Confirm workspace notes are visible only to allowed members.

## Comments And Attachments

1. Open comments/attachments on a note.
2. Confirm comments and attachments load only after opening the section.
3. Add, edit, and delete a comment.
4. Upload and delete an allowed attachment.
5. Try an unsupported file type and confirm the error is clear.
6. Watch the browser network panel and confirm comments/attachments are not refetched continuously.

## AI And Billing

1. Generate a note summary.
2. Suggest tags.
3. Generate meeting AI actions.
4. Save an AI result to a note.
5. Save an AI result as a comment.
6. Confirm usage count updates.
7. Confirm a Free account sees a helpful upgrade message when limits are reached.
8. Confirm Premium billing buttons still open the correct Stripe flow.

## Production Network Checks

1. Confirm `VITE_API_BASE_URL` points to the Render backend.
2. Confirm backend `CLIENT_ORIGIN` matches the Netlify production URL.
3. Confirm preview URLs are allowed only for this Netlify site.
4. Confirm browser console has no repeating 401, 400, CORS, or WebSocket loops.
5. Ignore extension-only messages such as `chrome-extension://invalid` when they do not come from the app.

## Release Decision

Ship only when:

- Client lint passes.
- Client build passes.
- Backend lint passes.
- Auth, notes, workspaces, voice, AI, and billing smoke tests pass.
- No repeated request loops are visible in the Network panel.
- Mobile navigation works on both iPhone and Android.
