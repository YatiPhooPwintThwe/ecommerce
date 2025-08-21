const userTypeDef = `#graphql


  enum Role {

    USER
    ADMIN
  }

  enum PaymentMethod {
    CARD
    PAYPAL
  }

 
   
   type Address {

     street: String
     city: String
     state: String
     postalCode: String
     country: String
   }
   type AdminUser {
  _id: ID!
  name: String!
  role: Role!
}


   type User {

     _id: ID!
     name: String!
     email: String!
     phone: String
     address: Address
     paymentMethod: PaymentMethod
     role: Role!
     isVerified: Boolean!
     createdAt: String!
     updatedAt: String!
   }
   

   type Query {

     authAdmin: AdminUser
     authUser: User
     user(userId: ID!): User
     users: [User!]! #Admin

   }
     
   
   type Mutation {
   
      updateProfile(input: UpdateProfileInput!): User!
      
    }
      
    
    input UpdateProfileInput {
    
       name: String
       phone: String
       address: AddressInput
       paymentMethod: PaymentMethod
      
    
   }
    
   input AddressInput {
   
     street: String!
     city: String!
     state: String!
     postalCode: String!
     country: String!
     
   }
   `;

export default userTypeDef;
