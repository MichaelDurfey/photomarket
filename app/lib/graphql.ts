import { gql } from "@apollo/client";

export const GET_PHOTOS = gql`
  query GetPhotos {
    photos {
      id
      title
      url
      price
    }
  }
`;

export const GET_PHOTO = gql`
  query GetPhoto($id: ID!) {
    photo(id: $id) {
      id
      title
      url
      price
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      token
      user {
        id
        username
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
      }
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation LogoutUser {
    logout
  }
`;
