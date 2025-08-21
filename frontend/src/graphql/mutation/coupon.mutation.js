import { gql } from "@apollo/client";
export const VALIDATE_COUPON = gql`
  mutation ValidationCoupon($code: String!) {
    validateCoupon(code: $code) {
      code
      discountPercentage
      message
    }
  }
`;
