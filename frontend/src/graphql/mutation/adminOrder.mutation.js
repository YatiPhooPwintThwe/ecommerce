import { gql } from "@apollo/client";
import { ADMIN_ORDER_FIELDS } from "../query/adminOrder.query.js";

export const DISPATCH_ORDER = gql`
  ${ADMIN_ORDER_FIELDS}
  mutation DispatchOrder($orderId: ID!, $etaDays: Int = 7) {
    dispatchOrder(orderId: $orderId, etaDays: $etaDays) {
      success
      message
      order { ...AdminOrderFields }
    }
  }
`;