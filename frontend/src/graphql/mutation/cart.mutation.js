import { gql } from "@apollo/client";
import { CART_PRODUCT_FIELDS } from "../fragments/cart.fragment";

export const ADD_TO_CART = gql`
  ${CART_PRODUCT_FIELDS}
  mutation AddToCart($productId: ID!) {
    addToCart(productId: $productId) {
      ...CartProductFields
    }
  }
`;

export const REMOVE_ALL_FROM_CART = gql`
  ${CART_PRODUCT_FIELDS}
  mutation RemoveAllFromCart($productId: ID!) {
    removeAllFromCart(productId: $productId) {
      ...CartProductFields
    }
  }
`;

export const UPDATE_CART_QUANTITY = gql`
  ${CART_PRODUCT_FIELDS}
  mutation UpdateCartQuantity($productId: ID!, $quantity: Int!) {
    updateCartQuantity(productId: $productId, quantity: $quantity) {
        ...CartProductFields

    }
  }
`;

export const CLEAR_CART = gql`
  ${CART_PRODUCT_FIELDS}
  mutation ClearCart {
    clearCart {
      ...CartProductFields
    }
  }
`;
