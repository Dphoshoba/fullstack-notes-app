# Express MongoDB Auth API

A complete Node.js REST API using Express, MongoDB, Mongoose, JWT access tokens, refresh tokens, cookies, validation, rate limiting, and protected CRUD routes.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The API defaults to `http://localhost:4000`.

## Environment

Set these values in `.env`:

```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/express_auth_api
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_PRICE_ID=price_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

## Auth Flow

- Register or log in to receive an access token in the JSON response.
- A refresh token is also stored in an HTTP-only cookie.
- Send the access token as `Authorization: Bearer <token>` for protected routes.
- Call `/api/auth/refresh` to rotate the refresh token and get a new access token.
- Call `/api/auth/logout` to revoke the active refresh token.

## Routes

### Health

```http
GET /api/health
```

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

Register body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Password123!"
}
```

Login body:

```json
{
  "email": "ada@example.com",
  "password": "Password123!"
}
```

### Notes

All note routes require `Authorization: Bearer <token>`.

```http
GET    /api/notes
POST   /api/notes
GET    /api/notes/:id
PATCH  /api/notes/:id
DELETE /api/notes/:id
```

Create note body:

```json
{
  "title": "Build API",
  "body": "Finish auth and CRUD routes.",
  "tags": ["node", "express"],
  "pinned": true
}
```

### Users

User administration routes require `Authorization: Bearer <token>`.

```http
GET   /api/users
PATCH /api/users/:id/role
```

- `GET /api/users` requires role `admin` or `superadmin`.
- `PATCH /api/users/:id/role` requires role `superadmin`.
- Valid roles are `user`, `admin`, and `superadmin`.
- Register/login/profile routes do not accept role updates; role changes only happen through the protected superadmin route.

Update role body:

```json
{
  "role": "admin"
}
```

### Billing

Stripe is wired for test-mode Premium upgrades. Do not commit real Stripe keys.

Backend environment variables:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_ORIGIN=http://localhost:5173
```

Local setup:

1. Create a Stripe test-mode product and recurring price for the Premium plan.
2. Put the test secret key in `STRIPE_SECRET_KEY`.
3. Put the test price ID in `STRIPE_PRICE_ID`.
4. Configure the Stripe Billing Portal in the Stripe Dashboard before using Manage billing.
5. Install and log in to the Stripe CLI.
6. Forward webhooks to the local backend:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

7. Copy the CLI webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
8. Restart the backend after changing `.env`.

Protected billing routes:

```http
POST /api/billing/create-checkout-session
POST /api/billing/create-portal-session
GET  /api/billing/status
```

Webhook route:

```http
POST /api/billing/webhook
```

On successful checkout completion, the webhook updates the matching user to `plan: "premium"`.

## Seed Demo User

```bash
npm run seed
```

Demo credentials:

```text
Demo user: demo@example.com / Password123!
Admin user: admin@example.com / Password123!
Super admin: superadmin@example.com / Password123!
```

## Testing Admin Routes

Seed the database, log in as the admin or superadmin user, then use the returned `accessToken`.

```bash
npm run seed
```

List users as admin or superadmin:

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Update a user role as superadmin:

```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_SUPERADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"admin\"}"
```

## React Frontend

The frontend lives in `client/` and calls the backend at `http://localhost:4000`.

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

From the project root, you can also run:

```bash
npm run dev:api
npm run dev:client
npm run dev:full
```

## Production Readiness

Use this section before deploying the app outside your local machine.

### Launch Checklist

Before launch, walk through this checklist from top to bottom:

- Run local backend lint from the project root: `npm run lint`.
- Run local client lint from `client/`: `npm run lint`.
- Run a production client build from `client/`: `npm run build`.
- Test core user flows locally: register, login, logout, create note, edit note, delete note, search, filters, pin/star, comments, attachments, meeting notes, AI tools, export, profile, settings, workspace, admin, upgrade, and billing portal.
- Confirm Render has all backend production environment variables.
- Confirm Netlify has `VITE_API_BASE_URL` set to the deployed Render backend URL.
- Confirm deployment URLs are final before setting CORS.
- Set backend `CLIENT_ORIGIN` to the exact Netlify frontend origin.
- Set `COOKIE_SECURE=true` for production HTTPS.
- Confirm MongoDB Atlas Network Access allows the Render service to connect.
- Confirm Stripe live keys are used only when you are ready for real payments.
- Configure the Stripe webhook endpoint as `https://your-api.onrender.com/api/billing/webhook`.
- Store the matching Stripe webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
- Use strong production JWT secrets and never reuse example values.
- Never commit real `.env` files or secrets.
- Create a real admin or superadmin account for production and remove demo seed users.

### Environment Validation Checklist

Backend environment variables:

- `NODE_ENV=production`
- `PORT` is set by your host, or defaults to `4000` locally.
- `MONGODB_URI` points to your MongoDB Atlas connection string.
- `JWT_ACCESS_SECRET` is a long random secret, not the example value.
- `JWT_REFRESH_SECRET` is a different long random secret, not the example value.
- `ACCESS_TOKEN_EXPIRES_IN=15m` or another short access-token lifetime.
- `REFRESH_TOKEN_EXPIRES_IN=7d` or your chosen refresh-token lifetime.
- `CLIENT_ORIGIN` is your deployed frontend URL, for example `https://your-app.netlify.app`.
- `COOKIE_SECURE=true` in production.

Frontend environment variables:

- `VITE_API_BASE_URL` is your deployed backend URL, for example `https://your-api.onrender.com`.
- Do not include a trailing slash in `VITE_API_BASE_URL`.

Before deploying:

```bash
npm run lint
cd client
npm run lint
npm run build
```

### MongoDB Atlas Setup

1. Create a free MongoDB Atlas account.
2. Create a new project and a free cluster.
3. Create a database user with a strong password.
4. In Network Access, add the IP addresses allowed to connect.
5. For Render, you can start with `0.0.0.0/0` if needed, but restrict this later when possible.
6. Copy the connection string from Atlas.
7. Replace `<password>` and database name in the string.
8. Use that full string as `MONGODB_URI`.

Example:

```bash
MONGODB_URI=mongodb+srv://app_user:YOUR_PASSWORD@cluster0.example.mongodb.net/express_auth_api
```

### Backend Deployment on Render

1. Push the project to GitHub.
2. In Render, create a new Web Service.
3. Connect your GitHub repository.
4. Set the root directory to the project root.
5. Set the runtime to Node.
6. Use this build command:

```bash
npm install
```

7. Use this start command:

```bash
npm start
```

8. Add the backend environment variables from the checklist.
9. Set `NODE_ENV=production`.
10. Set `COOKIE_SECURE=true`.
11. Set `CLIENT_ORIGIN` to your Netlify frontend URL after the frontend is deployed.
12. Deploy the service.
13. Test the health route:

```http
GET https://your-api.onrender.com/api/health
```

### Frontend Deployment on Netlify

1. In Netlify, create a new site from Git.
2. Connect the same GitHub repository.
3. Set the base directory to:

```text
client
```

4. Set the build command to:

```bash
npm run build
```

5. Set the publish directory to:

```text
client/dist
```

6. Add this environment variable:

```bash
VITE_API_BASE_URL=https://your-api.onrender.com
```

7. Deploy the site.
8. Copy the Netlify URL.
9. Go back to Render and set backend `CLIENT_ORIGIN` to that Netlify URL.
10. Redeploy the Render backend after changing `CLIENT_ORIGIN`.

### Production CORS Notes

The backend only allows requests from `CLIENT_ORIGIN`.

For local development:

```bash
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
```

For production:

```bash
CLIENT_ORIGIN=https://your-app.netlify.app
COOKIE_SECURE=true
```

If login works but refresh/logout cookies do not behave correctly, check:

- The frontend is calling the exact backend URL in `VITE_API_BASE_URL`.
- The backend `CLIENT_ORIGIN` exactly matches the frontend origin.
- `COOKIE_SECURE=true` is set for HTTPS production deployments.
- The browser is not blocking third-party cookies for your deployment setup.

### Security Checklist

- Confirm `.env` is ignored by Git before adding real secrets. This repo ignores `.env` by default.
- Never commit secrets, API keys, JWT secrets, database passwords, or Stripe keys.
- Use strong, unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`; production secrets should be at least 32 characters and must not use the example values.
- Keep `ACCESS_TOKEN_EXPIRES_IN` short, such as `15m`.
- Keep refresh tokens in HTTP-only cookies and set `COOKIE_SECURE=true` in production.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin. Do not leave broad or wildcard CORS origins in production.
- Set `STRIPE_WEBHOOK_SECRET` and verify Stripe webhook signatures before trusting billing events.
- Keep `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` only in backend environment settings. The frontend must never receive Stripe secret keys.
- Do not trust the frontend for plan changes. Premium status should change only from verified Stripe webhooks.
- Restrict MongoDB Atlas Network Access as much as your host allows.
- Use a MongoDB database user with only the permissions the app needs.
- Keep file uploads limited to approved types: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, TXT, and MD.
- Keep upload size limits enabled and review the limit before accepting larger files.
- Store production secrets in Render and Netlify environment settings, not in source files.
- Rotate secrets immediately if they are exposed.
- Do not use demo seed accounts in a real production database.
