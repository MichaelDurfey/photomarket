import { GraphQLClient } from "graphql-request";

// Create a GraphQL client for server-side operations
export function createGraphQLClient(url: string) {
  return new GraphQLClient(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Default client instance
export const graphqlClient = createGraphQLClient(
  "http://localhost:3000/graphql"
);
