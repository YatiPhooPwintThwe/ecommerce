import { gql } from "@apollo/client";
import { USER_CORE_FIELDS } from "../fragments/user.fragment.js";


export const GET_AUTH_ADMIN = gql`
  query GetAuthAdmin {
    authAdmin {
      _id
      name
      role
    }
  }
`;


export const GET_AUTH_USER = gql`
  ${USER_CORE_FIELDS}
  query GetAuthUser {
    authUser {
      ...UserCoreFields
    }
  }
`;

export const GET_USER = gql`
  ${USER_CORE_FIELDS}
  query GetUser($userId: ID!) {
    user(userId: $userId) {
      ...UserCoreFields
    }
  }
`;

export const GET_USERS = gql`
  ${USER_CORE_FIELDS}
  query GetUsers {
    users {
      ...UserCoreFields
    }
  }
`;
