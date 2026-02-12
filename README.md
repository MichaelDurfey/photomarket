# Photo Store

This is a small photo store built with React Router 7, React, and a GraphQL backend. It lets you browse and sell photos, with an Adobe Lightroom integration so you can serve images directly from your own albums.

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

## Project structure (high level)

```text
app/        React Router app (routes, components, Apollo client, Tailwind)
backend/    GraphQL API (Apollo Server + Express, auth, Adobe integration)
```

## More docs

For API schema, HTTPS configuration, and Adobe Lightroom setup (OAuth and tokens), see the docs in the `backend` folder, especially `backend/README.md` and `backend/README_ADOBE.md`.
