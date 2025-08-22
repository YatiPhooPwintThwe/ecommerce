import { gql } from "@apollo/client";
export const PRODUCT_MIN_FIELDS = gql`
  fragment ProductMinFields on Product {
    _id
    name
    image
    
  }
`;

export const ORDER_PRODUCT_FIELDS = gql`
  ${PRODUCT_MIN_FIELDS}
  fragment OrderProductFields on OrderProduct {
    quantity
    price
    product {
      ...ProductMinFields
    }
  }
`;

export const ORDER_FIELDS = gql`
  ${ORDER_PRODUCT_FIELDS}
  fragment OrderFields on Order {
    _id
    totalAmount
    paymentStatus
    paymentMethod
    createdAt
    fulfillmentStatus
    dispatchedAt
    estimatedDeliveryDate
    products {
      ...OrderProductFields
    }

    user {
      _id
      name
      email
      address { postalCode country }
    }
  }
`;

