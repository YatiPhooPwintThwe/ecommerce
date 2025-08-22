import { gql } from "@apollo/client";
import { ORDER_PRODUCT_FIELDS } from "../fragments/order.fragment.js";

export const ADMIN_ORDER_FIELDS = gql`
  ${ORDER_PRODUCT_FIELDS}
  
  fragment AdminOrderFields on Order {
    _id
    totalAmount
    paymentStatus
    paymentMethod
    createdAt
    fulfillmentStatus
    dispatchedAt
    estimatedDeliveryDate
    products { ...OrderProductFields }
    user {
      _id
      name
      email
      address { postalCode country }
    }
  }
`;

export const GET_ADMIN_ORDERS = gql`
  ${ADMIN_ORDER_FIELDS}
  query GetAdminOrders {
    adminOrders { ...AdminOrderFields }
  }
`;
