import { gql } from "@apollo/client";
import { CART_PRODUCT_FIELDS } from "../fragments/cart.fragment";

export const GET_CART_PRODUCTS = gql`
  ${CART_PRODUCT_FIELDS}
  query GetCartProducts {
    cartProducts {
      ...CartProductFields
    }
  }
`;
