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

#### AuthPayload

```graphql
type AuthPayload {
  token: String!
  user: User!
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

#### Register a new user

```graphql
mutation {
  register(username: "john_doe", password: "password123") {
    token
    user {
      id
      username
    }
  }
}
```

#### Login

```graphql
mutation {
  login(username: "john_doe", password: "password123") {
    token
    user {
      id
      username
    }
  }
}
```

#### Logout

```graphql
mutation {
  logout
}
```

## Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication. When you register or login, a token is automatically set in the cookie. The `me` query requires authentication and will return the current user's information.

## Error Handling

The API includes comprehensive error handling for:

- Invalid credentials
- Username already exists
- Invalid tokens
- Missing required fields

## Data Storage

Currently, the application uses JSON files for data storage:

- `users.json` - Stores user data
- `photos.json` - Stores photo data

In a production environment, you should replace this with a proper database.
