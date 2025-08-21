const couponTypeDef = `#graphql

  type Coupon {
  
    _id: ID!
    code: String!
    discountPercentage: Int!
    redeemed: Boolean!
    isActive: Boolean!
    userId: ID!
    createdAt: String!
    updatedAt: String!
    
    
  }
    
  type CouponValidationResult {
  
    message: String!
    code: String
    discountPercentage: Int
    
   }

   
  type RedeemCouponResult {
    message: String!
    success: Boolean!
  }
    
   
   type Query {
   
     myCoupon: Coupon
     
   }
     
   type Mutation {
   
     validateCoupon(code: String!): CouponValidationResult!
      redeemCoupon(code: String!): RedeemCouponResult! 
   }
     
   `;

export default couponTypeDef;
