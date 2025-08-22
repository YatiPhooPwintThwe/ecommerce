const orderAdmintypeDef = `#graphql

   extend type Order {

      fulfillmentStatus: String
      dispatchedAt: String
      estimatedDeliveryDate: String
      
    }

    type DispatchOrderResult {
    
       success:Boolean!
       message: String!
       order: Order!
       
    }
      
    extend type Query{

       adminOrders: [Order!]!
       
    }
       
    extend type Mutation {

      dispatchOrder(orderId: ID!, etaDays: Int = 7): DispatchOrderResult!
      
    }
`;

export default orderAdmintypeDef;