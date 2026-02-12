import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import https from "node:https";

interface NodeFetchRequestInit extends RequestInit {
  agent?: https.Agent;
}

const allowInsecureSsl =
  typeof process !== "undefined" &&
  process.env.ALLOW_INSECURE_SSL === "true";

if (allowInsecureSsl && typeof process !== "undefined") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const sharedAgent =
  allowInsecureSsl && typeof window === "undefined"
    ? new https.Agent({
        rejectUnauthorized: false,
      })
    : undefined;

const serverFetch: typeof fetch = (input, init) => {
  if (!sharedAgent) {
    return fetch(input, init);
  }

  const nextInit: NodeFetchRequestInit = {
    ...(init as NodeFetchRequestInit),
  };

  if (!nextInit.agent) {
    nextInit.agent = sharedAgent;
  }

  return fetch(input, nextInit);
};

/**
 * Creates a new Apollo Client instance for server-side rendering.
 * Each request should get its own client instance to avoid cache pollution.
 */
export function createServerClient(cookieHeader?: string) {
  const httpLink = createHttpLink({
    uri: process.env.GRAPHQL_URL || "http://localhost:3000/graphql",
    // Use native fetch (available in Node 18+)
    fetch: serverFetch,
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
