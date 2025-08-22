const orderTypeDef = `#graphql

   enum PaymentMethod {

      CARD
       
   }
      
   
   type OrderProduct {
   
     product: Product!
     quantity: Int!
     price: Float!
     
   }
     
   type Order {
   
     _id: ID!
     user: User
     products: [OrderProduct!]!
     totalAmount: Float!
     paymentMethod: PaymentMethod
     paymentStatus: String!
     stripeSessionId: String!
     createdAt: String!
    
     
   }
     
   
   input CheckoutProductInput {
   
      _id: ID!
    name: String!
    price: Float!
    quantity: Int!
    image: String!
     
   }


   type CheckoutSessionResponse {
   
     id: String!
     url: String
     totalAmount: Float!
     
   }
     
   type Query {
   
     orders: [Order!]!
     order(orderId: ID!): Order
     
   }
     
   type Mutation {
   
     checkout(products: [CheckoutProductInput!]!, couponCode: String): CheckoutSessionResponse!
     confirmOrder(sessionId: String!): Order!
     
   }
   `;

export default orderTypeDef;
