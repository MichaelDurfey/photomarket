# Photo Store with React Router 7, React 19, and GraphQL

A modern photo store application built with React Router 7, React 19 Server Components, and GraphQL with Apollo Server.

## Features

- **React Router 7**: The latest version with full React 19 support
- **React 19 Server Components**: Server-side rendering with modern React features
- **GraphQL API**: Apollo Server backend with comprehensive schema
- **Authentication**: JWT-based authentication with secure cookies
- **Modern UI**: Tailwind CSS for beautiful, responsive design
- **TypeScript**: Full type safety throughout the application

## Tech Stack

### Frontend

- React 19 with Server Components
- React Router 7
- Apollo Client for GraphQL
- Tailwind CSS
- TypeScript

### Backend

- Apollo Server with Express
- GraphQL schema and resolvers
- JWT authentication
- bcrypt for password hashing

## Project Structure

```
photostore/
├── app/                    # React Router 7 app directory
│   ├── routes/            # Route components
│   │   ├── _index.tsx     # Home page with Server Components
│   │   ├── login.tsx      # Login form
│   │   └── register.tsx   # Registration form
│   ├── lib/               # Utility libraries
│   │   ├── apollo-client.ts    # Apollo Client config
│   │   ├── graphql.ts          # GraphQL operations
│   │   └── graphql-server.ts   # Server-side GraphQL client
│   ├── tailwind.css       # Tailwind styles
│   └── root.tsx           # Root component
├── backend/                # GraphQL API server
│   ├── server.js          # Apollo Server setup
│   ├── schema.js          # GraphQL schema
│   ├── resolvers.js       # GraphQL resolvers
│   ├── auth.js            # Authentication middleware
│   └── README.md          # API documentation
├── react-router.config.js # React Router 7 configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
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

4. **Start the React Router 7 frontend:**

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3001 (or next available port)
- GraphQL API: http://localhost:3000/graphql
- GraphQL Playground: http://localhost:3000/graphql

## React 19 Server Components

This application demonstrates React 19 Server Components with React Router 7:

### Server Components

- **PhotoGrid**: Fetches data on the server and renders HTML
- **Data Fetching**: Uses server-side GraphQL queries for better performance
- **SEO**: Server-rendered content for better search engine optimization

### Client Components

- **Forms**: Interactive login and registration forms
- **Navigation**: Client-side routing with React Router 7
- **State Management**: Apollo Client for GraphQL state management

## GraphQL API

The backend provides a comprehensive GraphQL API:

### Queries

- `photos`: Get all photos
- `photo(id)`: Get a specific photo
- `me`: Get current user information

### Mutations

- `register(username, password)`: Create a new user account
- `login(username, password)`: Authenticate user
- `logout`: Clear authentication

### Authentication

- JWT tokens stored in HTTP-only cookies
- Secure password hashing with bcrypt
- Protected routes and operations

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # TypeScript type checking
```

### Key Features

1. **Server Components**: The `PhotoGrid` component runs on the server and fetches data
2. **Client Components**: Forms and interactive elements run in the browser
3. **GraphQL Integration**: Seamless data fetching with Apollo Client
4. **Type Safety**: Full TypeScript support throughout the application
5. **Modern Routing**: React Router 7 with file-based routing

## Production Considerations

- Replace JSON file storage with a proper database
- Use environment variables for sensitive configuration
- Implement proper error boundaries and logging
- Add comprehensive testing
- Set up CI/CD pipeline
- Configure proper CORS and security headers

## Learn More

- [React Router 7 Documentation](https://reactrouter.com/)
- [React 19 Server Components](https://react.dev/)
- [Apollo GraphQL](https://www.apollographql.com/)
- [Tailwind CSS](https://tailwindcss.com/)
