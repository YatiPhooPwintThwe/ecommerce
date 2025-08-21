import { gql } from "@apollo/client";
import { PRODUCT_FIELDS } from "../fragments/product.fragment.js";

export const CREATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      ...ProductFields
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      ...ProductFields
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    deleteProduct(productId: $productId)
  }
`;

export const TOGGLE_FEATURED_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation ToggleFeaturedProduct($productId: ID!) {
    toggleFeaturedProduct(productId: $productId) {
      ...ProductFields
    }
  }
`;


