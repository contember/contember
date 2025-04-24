---
title: User Sessions
---

User session management is a key part of secure and seamless access to your application. This guide explains how session tokens work in Contember and how you can sign in, sign out, and manage session-related behavior using the Tenant API.

## Signing In

To begin a session, the user must call the `signIn` mutation using their credentials. Upon successful login, the server issues a session token, which must be included in subsequent requests.

### Example: Sign In with Credentials

```graphql
mutation {
  signIn(email: "admin@example.com", password: "123456", expiration: 60) {
    ok
    result {
      token
    }
    error {
      code
      retryAfter
    }
  }
}
```

- The `expiration` value defines the token's validity in **minutes**. If not set, a default value will be applied from the server config.
- The `retryAfter` field (returned when sign-in is rate-limited) indicates how many **seconds** you should wait before retrying.
- The token is extended automatically with every request — users typically don’t need to re-authenticate unless inactive for a long time.

### Login Rate Limiting

To protect against brute-force attacks, Contember implements adaptive rate limiting:

- If too many failed attempts are made from the same source, the server will respond with a `RATE_LIMIT_EXCEEDED` error and include `retryAfter` in seconds.
- The server uses a backoff algorithm with configuration options:
  - **Base delay** between attempts
  - **Maximum delay** cap
  - **Attempt window** length (time frame for tracking failed attempts)

### Hiding User Existence

By default, the API **does reveal** whether the email or password is incorrect. For example, if a user attempts to sign in with an unknown email, the error will be `UNKNOWN_EMAIL`, whereas an incorrect password returns `INVALID_PASSWORD`.

To prevent revealing whether an email exists, you can disable this behavior by setting `revealUserExists` to `false` in your configuration. When disabled, all login failures return a generic `INVALID_CREDENTIALS` error.
---

## Signing Out

You can end a session at any time using the `signOut` mutation. This invalidates the current token.

### Example: Sign Out

```graphql
mutation {
  signOut {
    ok
  }
}
```

To invalidate all tokens associated with your account (e.g. if you're logged in on multiple devices), set `all` to `true`.

### Example: Sign Out of All Sessions

```graphql
mutation {
  signOut(all: true) {
    ok
  }
}
```

> ⚠️ Note: You must be authenticated as a user to call `signOut`. It does not work with permanent API keys.

---

## Creating a Session Token as an Admin

Administrators with appropriate roles can generate a session token for any user using the `createSessionToken` mutation. This is useful for impersonation or debugging.

### Example: Create Session Token

```graphql
mutation {
  createSessionToken(email: "user@example.com", expiration: 120) {
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

- You must provide either an `email` or a `personId`.
- The `expiration` is specified in **minutes**.

---

## Login Configuration Options

Login behavior can be configured using the `configure` mutation and adjusted per environment or security requirement. You can inspect current login settings using the `configuration` query.

### Example: Fetching Login Configuration

```graphql
query {
  configuration {
    login {
      revealUserExists
      baseBackoff
      maxBackoff
      attemptWindow
      defaultTokenExpiration
      maxTokenExpiration
    }
  }
}
```

### Available Settings

- **`revealUserExists`**: Whether login errors should reveal whether a user exists.
- **`defaultTokenExpiration`**: Default lifetime of session tokens (used when `expiration` is omitted). Uses ISO 8601 intervals like `"PT30M"` for 30 minutes.
- **`maxTokenExpiration`**: Maximum allowed token lifetime.
- **`baseBackoff`**, **`maxBackoff`**: Controls exponential delay between attempts.
- **`attemptWindow`**: Defines how long failed login attempts are remembered.
