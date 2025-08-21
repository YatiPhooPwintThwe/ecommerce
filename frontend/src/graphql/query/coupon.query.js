import { gql } from "@apollo/client";
import { COUPON_FIELDS } from "../fragments/coupon.fragment.js";

export const GET_MY_COUPON = gql`
  ${COUPON_FIELDS}
  query GetMyCoupon {
    myCoupon {
      ...CouponFields
    }
  }
`;
