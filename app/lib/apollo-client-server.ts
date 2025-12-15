import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

/**
 * Creates a new Apollo Client instance for server-side rendering.
 * Each request should get its own client instance to avoid cache pollution.
 */
export function createServerClient(cookieHeader?: string) {
  const httpLink = createHttpLink({
    uri: process.env.GRAPHQL_URL || "http://localhost:3000/graphql",
    // Use native fetch (available in Node 18+)
    fetch: globalThis.fetch,
    headers: cookieHeader
      ? {
          cookie: cookieHeader,
        }
      : {},
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    ssrMode: true, // Enable SSR mode
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

