import { gql } from "@apollo/client";

export const USER_CORE_FIELDS = gql`
  fragment UserCoreFields on User {
    _id
    name
    email
    role
    isVerified
    phone
    address {
      street
      city
      state
      postalCode
      country
    }
  }
`;
