const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
  }

  type Photo {
    id: ID!
    title: String!
    url: String!
    price: Float!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Album {
    id: ID!
    name: String
  }

  type Query {
    "List albums (e.g. to find id for 'Europe 2025')."
    albums: [Album!]!
    "Optional: minRating (1-5), albumId, albumName (e.g. 'Europe 2025'), subtype, limit, offset"
    photos(
      minRating: Int
      albumId: ID
      albumName: String
      subtype: String
      limit: Int
      offset: String
    ): [Photo!]!
    photo(id: ID!): Photo
    me: User
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    logout: Boolean!
  }
`;

module.exports = typeDefs;
