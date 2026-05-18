---
title: Sign-up
---

The `signUp` mutation creates a new identity with an attached person record. It is gated by the `LOGIN` tenant role — usually the public login token is used to call it.

```graphql
mutation {
  signUp(
    email: "alice@example.com",
    password: "correct horse battery staple",
    captchaToken: "0.aXR…"
  ) {
    ok
    error {
      code
      weakPasswordReasons
      recommendedAction
      developerMessage
    }
    result {
      person { id email }
    }
  }
}
```

## Inputs

| Arg | Notes |
|---|---|
| `email` | Required. Validated for format and uniqueness. |
| `password` | Plain-text password. Validated against [`password` policy](./password-policy.md). |
| `passwordHash` | Optional alternative to `password`. Only `$2b$` bcrypt hashes are accepted; useful for migrations from existing systems. |
| `roles` | Optional global roles to grant. Subject to `PERSON_SIGN_UP` permission check. |
| `name` | Optional display name. |
| `captchaToken` | Required when [captcha](./anti-abuse.md#captcha) is configured. *(since 2.2)* |

`password` and `passwordHash` are mutually exclusive; pass neither to create a person with no password (intended for passwordless-only or IDP-only accounts).

## Errors

| Code | Cause |
|---|---|
| `INVALID_EMAIL_FORMAT` | Email failed format validation. |
| `EMAIL_ALREADY_EXISTS` | An account with that email already exists. Always returned, regardless of `login.revealUserExists` — see [Enumeration behavior](#enumeration-behavior). |
| `TOO_WEAK` | Password failed strength checks. See `weakPasswordReasons[]`. |
| `INVALID_CAPTCHA` | Captcha is configured and the token was missing or rejected. *(since 2.2)* |
| `RATE_LIMIT_EXCEEDED` | Per-IP sign-up rate limit hit. *(since 2.2)* |

### `recommendedAction` *(since 2.2)*

On `EMAIL_ALREADY_EXISTS`, the error carries a `recommendedAction` hint your UI can use to route the visitor to the right next step:

| Value | Meaning |
|---|---|
| `SIGN_IN` | The existing person has a password hash — they should sign in. |
| `RESET_PASSWORD` | The existing person has no password (created via IDP or invite without password) — they should go through password reset. |

The hint is purely advisory; clients that don't recognize it should fall back to a generic "already registered" message.

```graphql
{
  ok: false,
  error: {
    code: "EMAIL_ALREADY_EXISTS",
    recommendedAction: "SIGN_IN",
    developerMessage: "..."
  }
}
```

## Enumeration behavior

`signUp` always returns `EMAIL_ALREADY_EXISTS` when the address is taken — `revealUserExists: false` does **not** suppress it. An earlier silent-success branch (return `ok: true, result: null` and mail the legitimate owner) was tried and removed: `result === null` vs `result !== null` is trivially distinguishable, so the branch did not actually close the enumeration oracle while degrading UX.

For tenants that genuinely cannot tolerate sign-up enumeration the recommended pattern is to gate sign-up behind an invite-only flow (don't expose `signUp` to the public login token) and run the public flow through [`createResetPasswordRequest`](./password-reset.md), which is the only auth-flow endpoint that *can* mask existence without lying about it.

See [anti-abuse → enumeration protection](./anti-abuse.md#enumeration-protection) for the matrix across all auth flows.

## Audit

A `person_invite` entry is written only for `invite` / `unmanagedInvite`. Direct `signUp` calls are not audit-logged at the tenant level — the resulting person is observable via the regular identity / person queries.
