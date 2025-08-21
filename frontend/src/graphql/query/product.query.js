import { gql } from "@apollo/client";
import {
  PRODUCT_FIELDS,
  PRODUCT_CARD_FIELDS,
} from "../fragments/product.fragment.js";

export const GET_PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query GetProducts {
    products {
      ...ProductFields
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query GetFeaturedProducts {
    featuredProducts {
      ...ProductFields
    }
  }
`;

export const GET_RECOMMENDED_PRODUCTS = gql`
  ${PRODUCT_CARD_FIELDS}
  query GetRecommendedProducts {
    recommendedProducts {
      ...ProductCardFields
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  ${PRODUCT_FIELDS}
  query GetProductsByCategory($category: String!) {
    productByCategory(category: $category) {
      ...ProductFields
    }
  }
`;

export const GET_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  query GetProduct($productId: ID!) {
    product(productId: $productId) {
      ...ProductFields
    }
  }
`;
