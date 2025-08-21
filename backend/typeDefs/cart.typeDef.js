const cartTypeDef = `#graphql

   type CartProduct {

     _id: ID!
     name: String!
     description: String!
     price: Float!
     image: String
     quantity: Int!

   }
     
   type Query {
   
     cartProducts: [CartProduct!]!
     
   }
     
   type Mutation {
   
     addToCart(productId: ID!): [CartProduct!]!
     removeAllFromCart(productId: ID!): [CartProduct!]!
     updateCartQuantity(productId: ID!, quantity: Int!): [CartProduct!]!
     clearCart: [CartProduct!]!
   }
     
   `;

export default cartTypeDef;
