import { gql } from "@apollo/client";

export const COUPON_FIELDS = gql`
  fragment CouponFields on Coupon {
    __typename
    code
    discountPercentage
    redeemed
    isActive
  }
`;
