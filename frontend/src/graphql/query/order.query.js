import { gql } from "@apollo/client";
import { ORDER_FIELDS } from "../fragments/order.fragment.js";

export const GET_ORDERS = gql`
  ${ORDER_FIELDS}
  query GetOrders {
    orders {
      ...OrderFields
    }
  }
`;

export const GET_ORDER = gql`
  ${ORDER_FIELDS}
  query GetOrder($orderId: ID!) {
    order(orderId: $orderId) {
      ...OrderFields
    }
  }
`;
