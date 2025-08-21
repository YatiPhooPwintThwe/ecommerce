import { gql } from "@apollo/client";
export const SIGN_UP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      _id
      name
      email
      isVerified
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      _id
      name
      email
      role
      isVerified
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

export const UPDATE_EMAIL = gql `
   mutation UpdateEmail($newEmail: String!) {
    updateEmail(newEmail: $newEmail)

   }
`;

export const VERIFY_EMAIL = gql `
   mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
   }
`;

export const RESEND_VERIFICATION = gql`
  mutation ResendVerification {
    resendVerification
  }
`;


export const FORGOT_PASSWORD = gql `
   mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)

   }
`;

export const RESET_PASSWORD = gql `
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)

  }
`;

export const CHANGE_PASSWORD = gql `
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)

  }
`;
