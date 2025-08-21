import { gql } from "@apollo/client";

export const CART_PRODUCT_FIELDS = gql`
  fragment CartProductFields on CartProduct {
    _id
    name
    description
    price
    image
    quantity
  }
`;
