# Photo Store with React Router 7, React 19, and GraphQL

A modern photo store application built with React Router 7, React 19, and GraphQL with Apollo Server. Optional **Adobe Lightroom** integration lets you connect your catalog and sell photos from your albums.

## Features

- **React Router 7**: File-based routing with loaders and full React 19 support
- **React 19**: Server-side data fetching via loaders and client-side Apollo Client
- **GraphQL API**: Apollo Server backend with photos, albums, and auth
- **Adobe Lightroom (optional)**: Connect your Adobe account to serve photos from your Lightroom catalog
- **Authentication**: JWT-based authentication with HTTP-only cookies
- **Modern UI**: Tailwind CSS for responsive layout
- **TypeScript**: Type safety across the app

## Tech Stack

### Frontend

- React 19 with React Router 7 (loaders for SSR)
- Apollo Client for GraphQL
- Tailwind CSS
- TypeScript

### Backend

- Apollo Server with Express (optional HTTPS)
- GraphQL schema and resolvers; optional Adobe Lightroom integration
- JWT authentication (HTTP-only cookies), bcrypt for passwords

## Project Structure

```
photostore/
├── app/                       # React Router 7 app
│   ├── components/
│   │   └── AdobeConnect/      # Adobe Lightroom connection status
│   ├── lib/
│   │   ├── apollo-client.ts       # Browser Apollo Client
│   │   ├── apollo-client-server.ts # Server-side GraphQL client
│   │   └── graphql.ts             # GraphQL operations
│   ├── index.tsx              # Home route (photos grid, loader-based SSR)
│   ├── login.tsx              # Login route
│   ├── register.tsx           # Register route
│   ├── routes.tsx             # Route definitions
│   ├── root.tsx               # Root layout
│   ├── entry.client.tsx       # Client entry
│   ├── entry.server.tsx       # Server entry
│   └── tailwind.css           # Tailwind styles
├── backend/                   # GraphQL API server
│   ├── server.js              # Apollo Server + Express (optional HTTPS)
│   ├── schema.js              # GraphQL schema
│   ├── resolvers.js           # GraphQL resolvers
│   ├── auth.js                # JWT auth middleware
│   ├── services/
│   │   └── adobe-lightroom.js # Adobe Lightroom API integration
│   ├── README.md              # API and HTTPS setup
│   └── README_ADOBE.md        # Adobe Lightroom setup guide
├── react-router.config.js     # React Router config
├── tailwind.config.js         # Tailwind config
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm or yarn

### Installation

1. **Install frontend dependencies:**

```bash
npm install
```

2. **Install backend dependencies:**

```bash
cd backend
npm install
```

3. **Start the GraphQL backend:**

```bash
cd backend
npm run dev
```

4. **Start the React Router 7 frontend** (from the project root):

```bash
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:5173 (or next available port from Vite)
- **GraphQL API**: http://localhost:3000/graphql (or https://localhost:3000/graphql if backend uses HTTPS)
- **GraphQL Playground**: Same URL as GraphQL API

5. **Optional – Adobe Lightroom**: To serve photos from your Lightroom catalog, see [backend/README_ADOBE.md](backend/README_ADOBE.md) for OAuth setup and environment variables.

### Environment (frontend)

Create a `.env` in the project root if needed:

- `GRAPHQL_URL` – GraphQL endpoint (e.g. `http://localhost:3000/graphql` or `https://localhost:3000/graphql`).
- `ALLOW_INSECURE_SSL=true` – Allow self-signed certs for server-side requests (e.g. when backend uses HTTPS with a local certificate). Browsers still use normal certificate validation.

### Backend HTTPS (optional)

The backend can run over HTTPS for local testing. See [backend/README.md](backend/README.md) for `HTTPS_ENABLED`, `SSL_KEY_PATH`, and `SSL_CERT_PATH`.

## Data fetching and routing

- **Loaders**: The home route uses a React Router loader to fetch photos from the GraphQL API on the server, so the initial HTML includes photo data (good for SEO and first paint).
- **Client fallback**: Apollo Client is used in the browser for subsequent navigations and when loader data is not used.
- **Forms**: Login and register are client-side forms with Apollo mutations.
- **Routing**: Routes are defined in `app/routes.tsx` (index, login, register).

## GraphQL API

The backend provides a GraphQL API; see [backend/README.md](backend/README.md) for the full schema and examples.

### Queries

- `albums`: List albums (e.g. from Adobe Lightroom)
- `photos(minRating, albumId, albumName, subtype, limit, offset)`: List photos with optional filters (e.g. `albumName: "Europe 2025"`)
- `photo(id)`: Get a single photo by ID
- `me`: Current authenticated user

### Mutations

- `register(username, password)`: Create a user account
- `login(username, password)`: Sign in (sets HTTP-only cookie)
- `logout`: Clear auth cookie

### Authentication

- JWT in HTTP-only cookies; password hashing with bcrypt. The `me` query and protected operations require a valid cookie.

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # TypeScript type checking
```

### Key features

1. **Loader-based SSR**: The index route loader fetches photos on the server for fast first load.
2. **Apollo Client**: Used in the browser for GraphQL queries and mutations (login, register, photos).
3. **Adobe Lightroom**: Optional; connect your catalog so the store serves your photos (see [backend/README_ADOBE.md](backend/README_ADOBE.md)).
4. **TypeScript**: Used across the app and in route types.
5. **Routing**: React Router 7 with routes defined in `app/routes.tsx`.

## Production considerations

- Replace JSON file storage (e.g. `users.json`, `adobe-tokens.json`) with a proper database and secret store
- Use environment variables for all secrets (Adobe credentials, JWT secret, etc.)
- Do not use `ALLOW_INSECURE_SSL` in production; use valid TLS certificates
- Add error boundaries, logging, tests, and CI/CD as needed
- Configure CORS and security headers for your deployment

## Learn more

- [React Router 7](https://reactrouter.com/)
- [React](https://react.dev/)
- [Apollo GraphQL](https://www.apollographql.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- **Adobe Lightroom**: [backend/README_ADOBE.md](backend/README_ADOBE.md)
