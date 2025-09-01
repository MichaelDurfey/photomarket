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

  type Query {
    photos: [Photo!]!
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
