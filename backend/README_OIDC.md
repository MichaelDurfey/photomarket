# Shop customer login (OpenID Connect)

Customers sign in through your OIDC provider (Auth0, Okta, Google, Keycloak, etc.). The backend runs the **authorization code flow with PKCE** (`openid-client`), validates `state` and `nonce`, then issues the same **JWT in an HTTP-only cookie** used by GraphQL `me` and `logout`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OIDC_ISSUER` | Yes | Issuer base URL (discovery document at `/.well-known/openid-configuration`). |
| `OIDC_CLIENT_ID` | Yes | Client ID from your IdP. |
| `OIDC_CLIENT_SECRET` | Depends on IdP | Confidential clients: set the secret. Public PKCE-only: leave empty if your provider allows. |
| `OIDC_REDIRECT_URI` | No | Default `http://localhost:3000/auth/oidc/callback`. Must match an allowed redirect URI in the IdP. |
| `OIDC_SCOPE` | No | Default `openid profile email`. |
| `FRONTEND_URL` | No | Where users are sent after login; default `http://localhost:3001`. |

## IdP configuration

1. Create an OIDC application (type “Web” or “Regular web”).
2. **Redirect URI:** same as `OIDC_REDIRECT_URI` (e.g. `http://localhost:3000/auth/oidc/callback`).
3. Enable the **authorization code** grant; PKCE is used automatically from the backend.

## Routes

- `GET /auth/oidc/login` — starts the flow (redirects to the IdP).
- `GET /auth/oidc/callback` — completes the flow, upserts `backend/data/users.json` by `sub`, sets `token` cookie, redirects to `FRONTEND_URL`.
- `GET /api/auth/oidc-status` — JSON `{ "configured": true|false }` for the UI.

## User records

Each user has `id`, `username` (from `email`, `preferred_username`, or `name`), and `oidcSub` (stable `sub` from the IdP). Password fields are no longer used for new sign-ins.

Legacy `users.json` entries with only `password` cannot sign in until they complete OIDC once (a new row with `oidcSub` is created) or you merge accounts manually.

## Google example

Use Google’s OIDC issuer:

```env
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=....apps.googleusercontent.com
OIDC_CLIENT_SECRET=...
OIDC_REDIRECT_URI=http://localhost:3000/auth/oidc/callback
```

In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application) and add the redirect URI above.
