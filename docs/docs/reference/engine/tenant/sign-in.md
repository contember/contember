---
title: Sign-in
---

Sign-in flows create a [session](./sessions.md). The Tenant API offers four entry points:

- `signIn` — email + password
- `signInIDP` — third-party identity provider (see [IdP](./idp.md))
- `signInPasswordless` — magic link / OTP (see [passwordless](./passwordless.md))
- `createSessionToken` — admin impersonation, no credentials required

All of them rely on the same per-IP rate limiting, captcha, and `revealUserExists` masking described in [anti-abuse](./anti-abuse.md). All of them are recorded in the [audit log](./audit-log.md).

## Password sign-in

```graphql
mutation {
  signIn(email: "admin@example.com", password: "…", expiration: 60) {
    ok
    result { token }
    error { code retryAfter }
  }
}
```

| Arg | Notes |
|---|---|
| `email`, `password` | Required. |
| `expiration` | Minutes the session token should live. Capped at `login.maxTokenExpiration`. |
| `otpToken` | TOTP code if 2FA is enabled for the person. |
| `options.trustForwardedClientInfo` | *(since 2.2)* See [proxy trust](./proxy-trust.md). |

Errors:

| Code | Cause |
|---|---|
| `UNKNOWN_EMAIL` | No person with that email. Only returned when `login.revealUserExists: true`. |
| `INVALID_PASSWORD` | Wrong password. Only returned when `login.revealUserExists: true`. |
| `INVALID_CREDENTIALS` | Wrong email *or* password. Returned when `login.revealUserExists: false`. |
| `PERSON_DISABLED` | The person has been disabled. |
| `NO_PASSWORD_SET` | The person has no password (IDP-only / passwordless-only). |
| `OTP_REQUIRED` | The person has 2FA enabled and `otpToken` was missing. |
| `INVALID_OTP_TOKEN` | 2FA token rejected. |
| `RATE_LIMIT_EXCEEDED` | Per-IP login rate limit *(since 2.2)* or per-email exponential backoff hit. `retryAfter` carries the wait in seconds. |

## Signing out

`signOut` invalidates the current session token. To end every session for the caller (e.g. "log out everywhere"):

```graphql
mutation { signOut(all: true) { ok } }
```

`signOut` requires a session token; it does not work with permanent API keys.

## Admin: create session token

A `SUPER_ADMIN` (or any role with the `PERSON_CREATE_SESSION_KEY` permission) can mint a session token for any person without credentials. Useful for impersonation and debugging:

```graphql
mutation {
  createSessionToken(email: "user@example.com", expiration: 120) {
    ok
    result { token }
    error { code }
  }
}
```

Pass either `email` or `personId`. Records a `create_session_token` audit entry.

## Login configuration

All login behavior is controlled by the `login` section of the tenant [configuration](./configuration.md):

| Field | Effect |
|---|---|
| `revealUserExists` | See [anti-abuse — enumeration protection](./anti-abuse.md#enumeration-protection). |
| `baseBackoff`, `maxBackoff`, `attemptWindow` | Per-email exponential backoff. Also drives the mail-init throttle for password reset and passwordless init. |
| `defaultTokenExpiration` | Lifetime applied when the client omits `expiration`. |
| `maxTokenExpiration` | Cap on client-requested `expiration`. |

## What the session can do

The session token authorizes subsequent Tenant API calls and Content API calls. The session's effective IP and User-Agent — visible in [`Identity.sessions`](./sessions.md) and in audit-log entries — depend on whether the api_key has [trust-forwarded-info](./proxy-trust.md).
