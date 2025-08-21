import { gql } from "@apollo/client";
import { ORDER_FIELDS } from "../fragments/order.fragment.js";

export const CHECKOUT = gql`
  mutation Checkout($products: [CheckoutProductInput!]!, $couponCode: String) {
    checkout(products: $products, couponCode: $couponCode) {
      id
      url
      totalAmount
    }
  }
`;

export const CONFIRM_ORDER = gql`
  ${ORDER_FIELDS}
  mutation ConfirmOrder($sessionId: String!) {
    confirmOrder(sessionId: $sessionId) {
      ...OrderFields
    }
  }
`;
