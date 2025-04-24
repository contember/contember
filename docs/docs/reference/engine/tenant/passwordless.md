---
title: Passwordless Authentication
---

The passwordless authentication feature provides a secure and user-friendly method for users to sign in to your application without needing a password. This feature leverages magic links sent via email, along with the option for a fallback OTP (One-Time Password) mechanism, to enhance security and usability. Users can seamlessly log in by simply clicking a link in their email, or if they open the link in a different browser or device, they can use a client-generated OTP to complete the login
process.

### Flow Overview

1. **Configuration**:

- Administrators must first configure the passwordless authentication settings via the GraphQL API.
- The configuration includes enabling the feature, setting the expiration time for magic links, and specifying the URL that will be included in the email.
- There is also an option to [override the default email template](./mail-templates.md) with a new `PASSWORDLESS_SIGN_IN` mail type.

2. **Initiating Sign-In**:

- The user begins the sign-in process by entering their email address.
- The system sends a magic link to the user's email, which contains a unique token with a default expiration of 5 minutes.
- The user is prompted to check their inbox for the magic link.

3. **Handling the Magic Link**:

- If the user clicks the magic link in the same browser where they initiated the request, they are automatically logged in.
- If the link is opened in a different browser or device, an OTP flow is activated:
  - A 6-digit (configurable) OTP is generated on the client-side and displayed to the user.
  - The original token becomes invalid once the OTP is generated, meaning it cannot be reused for automatic sign-in or for generating a new OTP.
  - The user copies the OTP and enters it into the original browser where they started the login process.
  - Users are allowed a maximum of 3 attempts to enter the correct OTP.

4. **Multi-Factor Authentication (MFA)**:

- If MFA is enabled for the user, they will be prompted to complete MFA authentication after the magic link or OTP validation.

5. **Rate Limits and Security**:

- There are no rate limits applied at this time, but the system enforces a token validity period (default 5 minutes) and a limit of 3 OTP attempts per magic link.

### GraphQL API

Below is an overview of the key mutations and types involved:

#### Configuration

**Mutation: `configure`**

- **Purpose**: Configure passwordless authentication settings.
- **Input**: `ConfigInput` containing passwordless settings such as enabling the feature, specifying the email URL, and setting the expiration time.
- **Response**: `ConfigureResponse` indicating success or failure (in case of invalid input).

```graphql
mutation {
  configure(config: {
    passwordless: {
      enabled: always,
      url: "https://example.com/auth",
      expiration: "PT5M"
    }
  }) {
    ok
    error {
      code
      developerMessage
    }
  }
}
```

#### Initiating Sign-In

**Mutation: `initSignInPasswordless`**

- **Purpose**: Initiate the passwordless sign-in process by sending a magic link to the user's email.
- **Input**: The user's email and optional settings such as email template variants.
- **Response**: `InitSignInPasswordlessResponse` containing a request ID and expiration time.

```graphql
mutation {
  initSignInPasswordless(email: "user@example.com") {
    ok
    error {
      code
      developerMessage
    }
    result {
      requestId
      expiresAt
    }
  }
}
```

#### Signing In with Magic Link or OTP

**Mutation: `signInPasswordless`**

- **Purpose**: Complete the sign-in process using the magic link or OTP.
- **Input**: The `requestId`, `validationType` (either `otp` or `token`), the `token` from the magic link or OTP code, and optionally the MFA OTP.
- **Response**: `SignInPasswordlessResponse` indicating success or failure, with details of the signed-in user if successful.

```graphql
mutation {
  signInPasswordless(requestId: "abcd1234", validationType: token, token: "xyz789", expiration: 5) {
    ok
    error {
      code
      developerMessage
    }
    result {
      token
      person {
        id
        email
      }
    }
  }
}
```

#### Activating Passwordless OTP

**Mutation: `activatePasswordlessOtp`**

- **Purpose**: Exchange a long token for a short OTP, which will be shown to the user for manual entry.
- **Input**: The `requestId`, the long `token`, and the `otpHash` generated from the client-side OTP.
- **Response**: `ActivatePasswordlessOtpResponse` indicating success or failure.

```graphql
mutation {
  activatePasswordlessOtp(requestId: "abcd1234", token: "xyz789", otpHash: "hashedOtpValue") {
    ok
    error {
      code
      developerMessage
    }
  }
}
```
