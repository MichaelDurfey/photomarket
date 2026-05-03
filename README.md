# Lightroom Photo Store

A modern photo store application built with React Router 7, React 19 Server Components, and GraphQL with Apollo Server.
Connects with the Adobe Lightroom APIs for Oauth, catalogs, assets and renditions.

## Install & run

```bash
# from repo root
npm install

cd backend
npm install
npm run dev      # start GraphQL API (port 3000 by default)

# in another terminal, from repo root
npm run dev      # start React Router frontend (Vite, port 5173 by default)
```

The frontend talks to the backend’s `/graphql` endpoint. If you change ports or enable HTTPS, point the frontend at the correct URL via environment variables (see `backend/README.md` for details).

### To sign in via Oauth to Adobe Lightroom

- Make sure you're utilizing Https
- navigate to the backend servers `/auth/adobe` endpoint.
  (This should redirect you to adobe for the Oauth.)
- Once you've logged in on the Adobe site, the temporary auth code must be added as a query param to the `/auth/adobe/callback?code=<your code>` route like so.

## Project structure (high level)

```text
app/        React Router app (routes, components, Apollo client, Tailwind)
backend/    GraphQL API (Apollo Server + Express, auth, Adobe integration)
```

1. Adobe Lightroom OAuth (owner setup)

```mermaid
sequenceDiagram
  autonumber
  actor Owner as Store owner (browser)
  participant UI as Frontend (e.g. AdobeConnect)
  participant API as Express backend :3000
  participant Adobe as Adobe IMS (ims-na1.adobelogin.com)
  participant LR as Lightroom API (lr.adobe.io)

  Owner->>UI: Open site / click connect link
  UI->>API: GET /api/adobe/status
  API-->>UI: connected: false
  Owner->>API: GET /auth/adobe (link target \_blank)
  API->>Adobe: 302 redirect to /ims/authorize/v2 (code + scopes)
  Owner->>Adobe: Sign in + consent
  Adobe->>API: GET /auth/adobe/callback?code=...
  API->>Adobe: POST /ims/token/v3 (authorization_code)
  Adobe-->>API: access_token, refresh_token, expires_in
  API->>API: saveTokens (file on disk)
  API-->>Owner: HTML success (+ optional redirect to FRONTEND_URL)

  Note over API,LR: Later: GraphQL photos/albums or REST /api/adobe/\* use stored token server-side
  Owner->>API: GraphQL or /api/adobe/photos
  API->>LR: Bearer access_token (refresh if needed)
  LR-->>API: catalog / assets / renditions
  API-->>Owner: Data or proxied image (/api/adobe/rendition/...)
```

2. Shop user flow

```mermaid
sequenceDiagram
  autonumber
  actor User as Shop user (browser)
  participant App as Remix app + Apollo
  participant GQL as Apollo /graphql
  participant Auth as auth.js (JWT)

  User->>App: Submit login form
  App->>GQL: mutation login(username, password)
  GQL->>GQL: bcrypt verify, generateToken
  GQL->>Auth: jwt.sign({ id, username })
  GQL-->>User: Set-Cookie: token=... (httpOnly)
  GQL-->>App: { token, user }

  User->>App: query me (with cookie)
  App->>GQL: Cookie forwarded
  GQL->>Auth: verify cookie JWT
  GQL-->>App: current user or null
```

## More docs

For API schema, HTTPS configuration, and Adobe Lightroom setup (OAuth and tokens), see the docs in the `backend` folder, especially `backend/README.md` and `backend/README_ADOBE.md`.
