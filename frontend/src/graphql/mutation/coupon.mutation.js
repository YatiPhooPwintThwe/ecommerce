import { gql } from "@apollo/client";
export const VALIDATE_COUPON = gql`
  mutation ValidationCoupon($code: String!) {
    validateCoupon(code: $code) {
      __typename
      code
      discountPercentage
      redeemed
      isActive
      message
    }
  }
`;
