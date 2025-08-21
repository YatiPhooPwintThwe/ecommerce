const authTypeDef = `#graphql

   type LogoutResponse {
   
     message: String!
     
   }
     
   type Mutation {
   
      signUp(input: SignUpInput!): User!
      login(input: LoginInput!): User!
      logout: LogoutResponse!
      updateEmail(newEmail: String!): Boolean!
      verifyEmail(token: String!): Boolean!
      forgotPassword(email: String!): Boolean!
      resendVerification: Boolean!  
      resetPassword(token: String!, newPassword: String!): Boolean!
      changePassword(currentPassword: String!, newPassword: String!): Boolean!
   }
      
   input SignUpInput {
   
     name: String!
     password: String!
     email: String!
     
   }
     
   input LoginInput {
   
     name: String!
     password: String!
     
   }
     
   `;

export default authTypeDef;
