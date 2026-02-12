import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:3000/graphql",
  credentials: "include", // Include cookies for authentication
});

/**
 * Creates the Apollo Client instance for client-side rendering.
 * If initial state is provided (from SSR), it will be used to hydrate the cache.
 */
export function createClient(initialState?: any) {
  const cache = new InMemoryCache();

  // Restore cache from SSR if provided
  if (initialState) {
    cache.restore(initialState);
  }

  return new ApolloClient({
    link: httpLink,
    cache,
    ssrMode: false, // Client-side mode
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
      },
      query: {
        errorPolicy: "all",
      },
    },
  });
}

// Default client instance (will be hydrated on mount)
export const client = createClient();
