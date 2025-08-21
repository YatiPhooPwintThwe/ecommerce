import { gql } from "@apollo/client";
import { USER_CORE_FIELDS } from "../fragments/user.fragment.js";

export const UPDATE_PROFILE = gql`
  ${USER_CORE_FIELDS} 
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
        ...UserCoreFields
    }
  }
`;

export const UPDATE_ADDRESS = gql`
  ${USER_CORE_FIELDS}
  mutation UpdateAddress($address: AddressInput!) {
    updateProfile(input: { address: $address }) {
      ...UserCoreFields
    }
  }
`;

export const UPDATE_PHONE = gql`
  ${USER_CORE_FIELDS}
  mutation UpdatePhone($phone: String!) {
    updateProfile(input: { phone: $phone }) {
      ...UserCoreFields
    }
  }
`;


