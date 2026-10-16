# Public Launch Checklist

Use this when you are ready to share Notes Workspace with real users.

## 1. Confirm Production URLs

- Netlify frontend opens successfully.
- Render backend health route returns `database: connected`.
- Direct frontend routes work:
  - `/login`
  - `/register`
  - `/settings`
  - `/guide`
  - `/privacy`
  - `/terms`
  - `/support`
  - `/invite/test-token`
- `VITE_API_BASE_URL` in Netlify points to the Render backend URL.
- `CLIENT_ORIGIN` in Render matches the exact Netlify production URL.

## 2. Confirm Public Pages

- Landing page hero and pricing sections look correct on desktop and mobile.
- Footer links open Privacy, Terms, and Support.
- Login/Register pages link to Privacy, Terms, and Support.
- Support email opens the correct email address.
- Set Netlify `VITE_SUPPORT_EMAIL` to the real support inbox before launch.

## 3. Confirm Auth And Workspace Flow

- Register creates a user and default workspace.
- Login works after logout.
- Expired sessions show `Please log in again.`
- Workspace Settings opens on desktop and mobile.
- Owner/manager can create invites.
- Invite link still appears even if email sending fails.
- Invite email appears in Resend when configured.
- Second account can accept an invite.

## 4. Confirm Notes And Calendar

- Create a standard note.
- Create a meeting note.
- Create an action note with a due date and priority.
- Edit and delete a note.
- Open a note by clicking the card.
- Use the note title index.
- Search notes.
- Filter by category, note type, starred, pinned, workspace/private, and action filters.
- Calendar date chips work:
  - All dates
  - Today
  - Tomorrow
  - Next 7 days

## 5. Confirm AI

- `OPENAI_API_KEY` is set in Render.
- Summarize note works.
- Suggest tags works.
- Smart suggestions work from create/edit forms.
- Meeting AI actions work.
- AI result can be copied.
- AI result can be saved to note.
- AI result can be saved as a comment.
- Free usage limit shows a clear upgrade message.
- Premium usage shows the higher limit.

## 6. Confirm Billing

- Stripe test mode works before switching to live mode.
- Stripe live mode is enabled only when ready for real payments.
- Render has:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
- Stripe webhook URL points to:

```text
https://your-api.onrender.com/api/billing/webhook
```

- Upgrade opens Stripe Checkout.
- Successful payment updates the plan.
- Manage billing opens the Stripe billing portal.
- Failed/cancelled billing events do not expose sensitive details.

## 7. Confirm Emails

- Render has:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `CLIENT_ORIGIN`
- `EMAIL_FROM` uses a verified sending domain.
- Test email endpoint is disabled unless actively troubleshooting.
- Workspace invite emails appear in Resend.
- If email fails, the app still creates and shows the invite link.

## 8. Confirm Mobile And PWA

- iPhone Safari smoke test passes.
- Android Chrome smoke test passes.
- Installed PWA opens and navigates correctly.
- Bottom dashboard navigation is usable.
- Floating create button does not cover important controls.
- Voice to text works after microphone permission is granted.
- PWA update prompt appears after a new deploy when an old version is cached.

## 9. Confirm Security Settings

- `.env` is not committed.
- Render secrets are set in environment settings only.
- Netlify has only public `VITE_` variables.
- Run `npm run env:check` against production-like environment values before launch.
- `COOKIE_SECURE=true` in production.
- JWT secrets are unique and at least 32 characters.
- MongoDB Atlas access is restricted as much as possible.
- File upload type and size validation are active.
- Debug routes are disabled in production unless actively troubleshooting.

## 10. Launch Decision

Launch only when:

- Backend lint passes.
- Backend typecheck passes.
- Backend audit has no moderate-or-higher unresolved issues.
- Client lint passes.
- Client build passes.
- Client audit has no moderate-or-higher unresolved issues.
- Mobile smoke tests pass.
- Signup, login, notes, invite, AI, and billing flows pass.
- Production logs show no repeated `401`, `400`, `429`, `500`, or CORS loops.

After launch, create a stable tag:

```bash
git tag v0.2.0-public-launch
git push origin v0.2.0-public-launch
```
