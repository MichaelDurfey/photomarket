import { gql } from "@apollo/client";

export const GET_PHOTOS = gql`
  query GetPhotos($albumName: String) {
    photos(albumName: $albumName) {
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

export const LOGOUT_USER = gql`
  mutation LogoutUser {
    logout
  }
`;
