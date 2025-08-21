const productTypeDef = `#graphql 

   type Product {
   
      _id: ID!
      name: String!
      description: String!
      price: Float!
      image: String
      category: String!
      stock: Int!
      sold: Int! 
      isFeatured: Boolean!
      createdAt: String!
      updatedAt: String!
      
   }
      
   type Query {
   
      products: [Product!]!
      featuredProducts: [Product!]!
      recommendedProducts: [Product!]!
      productByCategory(category: String!): [Product!]!
      product(productId: ID!): Product
      
   }
      
   input CreateProductInput{
   
     name: String!
     description: String!
     price: Float!
     image: String
     category: String!
     stock: Int!
     
   }

   input UpdateProductInput {

      productId: ID!
      name: String
      description: String
      price: Float
      image: String
      category: String
      stock: Int

   }
     
   type Mutation {
   
     createProduct(input: CreateProductInput!): Product!
     updateProduct(input: UpdateProductInput!): Product!
     deleteProduct(productId: ID!): String!
     toggleFeaturedProduct(productId: ID!): Product!
     
     
    }
     
    `;

export default productTypeDef;
