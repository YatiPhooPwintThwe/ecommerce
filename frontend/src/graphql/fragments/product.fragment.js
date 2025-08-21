import {gql} from "@apollo/client";
export const PRODUCT_FIELDS = gql `
  fragment ProductFields on Product {
    _id
    name
    description
    price
    image
    category
    stock
    isFeatured
    sold
    createdAt
    updatedAt

  }
`;

export const PRODUCT_CARD_FIELDS = gql`
   fragment ProductCardFields on Product {
    _id
    name
    description
    price
    image
    stock
    sold
    

   }
`;