---
title: User Sessions
---

User session management is a crucial aspect of maintaining secure and efficient interactions within your application. This guide elaborates on how to manage user sessions through sign-ins and sign-outs using Contember's Tenant API.

## Sign In to Your Account

To sign in, you need a [login token](overview.md#authorization-tokens). Once you've successfully signed in, a session token will be issued, which is necessary for making subsequent authenticated requests.

#### Example: How to Sign In

```graphql
mutation {
  signIn(email: "admin@example.com", password: "123456", expiration: 3600) {
    ok
    result {
      token
    }
    error {
      code
    }
  }
}
```

:::note
The session token's expiration time will be automatically extended with each subsequent request you make, so you don't need to worry about frequent re-logins.
:::

## Sign Out of Your Account

Signing out is straightforward: all you need to do is call the `signOut` mutation. This invalidates the session token associated with the current request, effectively logging you out.

#### Example: How to Sign Out from the Current Session

```graphql
mutation {
  signOut {
    ok
  }
}
```

### Signing Out of All Sessions

If you want to take an extra step in security or think your credentials have been compromised, you can invalidate all session tokens associated with your current identity by setting the `all` parameter to `true`.

#### Example: How to Sign Out from All Sessions

```graphql
mutation {
  signOut(all: true) {
    ok
  }
}
``` 

:::note
Keep in mind that the `signOut` mutation is only applicable for persons (users with a set of credentials). It cannot be called using a permanent API key. This design choice ensures that application-level permissions remain secure.
:::

## Advanced: Create session token manually

For users with `super_admin` or `project_admin` roles, the `createSessionToken` mutation provides a way to generate session tokens for other users. This functionality enables administrators to act as a specific user.

### Example: Create session token for given user

```graphql
mutation {
  createSessionToken(email: "example@email.com", expiration: 3600) {
    ok
    result {
      token
    }
    error {
      code
    }
  }
}
```

You must supply either an `email` or a `personId`, along with an optional expiration time for the token.
