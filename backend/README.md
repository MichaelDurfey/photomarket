# Photo Store GraphQL API

This is a GraphQL API built with Apollo Server and Express.js for a photo store application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. The GraphQL playground will be available at: `http://localhost:3000/graphql`

### Using HTTPS locally

The server can terminate HTTPS itself. Set `HTTPS_ENABLED=true` in `.env` and provide `SSL_KEY_PATH` and `SSL_CERT_PATH` that point to your key and certificate files (and optional `SSL_PASSPHRASE`). For local testing you can generate a self-signed certificate:

```bash
mkdir -p backend/certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout backend/certs/localhost-key.pem \
  -out backend/certs/localhost-cert.pem \
  -days 365 \
  -subj "/CN=localhost"
```

Then reference those paths in your `.env` file. When HTTPS is enabled the server logs will show `https://` URLs.

## GraphQL Schema

### Types

#### User

```graphql
type User {
  id: ID!
  username: String!
}
```

#### Photo

```graphql
type Photo {
  id: ID!
  title: String!
  url: String!
  price: Float!
}
```

### Queries

#### Get all photos

```graphql
query {
  photos {
    id
    title
    url
    price
  }
}
```

#### Get a specific photo

```graphql
query {
  photo(id: "1") {
    id
    title
    url
    price
  }
}
```

#### Get current user

```graphql
query {
  me {
    id
    username
  }
}
```

### Mutations

Shop sign-in uses **OpenID Connect** (see `README_OIDC.md`), not GraphQL mutations.

#### Logout

```graphql
mutation {
  logout
}
```

## Authentication

After a successful OIDC callback, the API sets a **JWT** in an **HTTP-only cookie** (`token`). The `logout` mutation clears it. The `me` query returns the current user when the cookie is present and valid. Configure the IdP in `.env` as described in `README_OIDC.md`.

## Error Handling

The API includes comprehensive error handling for:

- Invalid tokens
- Missing required fields

## Data Storage

Currently, the application uses JSON files for data storage:

- `users.json` - Stores user data
- `photos.json` - Stores photo data

In a production environment, you should replace this with a proper database.
