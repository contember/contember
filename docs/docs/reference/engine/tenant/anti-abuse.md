---
title: Anti-abuse protections
---

The Tenant API has five layered defenses against credential stuffing, account enumeration, password spraying, and resource abuse. They are independent — each can be enabled and tuned separately — and all live behind the [`configure`](./configuration.md) mutation.

:::note Available since 2.2
Captcha, per-IP rate limits, and the HIBP check ship in engine **2.2**. The per-email login backoff and `revealUserExists` flag have been around since 1.x.
:::

## Where each protection applies

| Layer | `signUp` | `signIn` | `createResetPasswordRequest` | `initSignInPasswordless` |
|---|---|---|---|---|
| Captcha | ✅ | — | ✅ | ✅ |
| Per-IP rate limit | ✅ `signUpPerIp` | ✅ `loginPerIp` | ✅ `passwordResetPerIp` | ✅ `passwordlessInitPerIp` |
| Per-email backoff | — | ✅ (login backoff) | ✅ (mail-init backoff) | ✅ (mail-init backoff) |
| HIBP password check | ✅ | — | — (applied on `resetPassword`) | — |
| Silent leak protection | ✅ | ✅ | ✅ | ✅ |

The HIBP check also applies to `changePassword`, `changeMyPassword`, and `resetPassword` — anywhere a password is being set.

## Captcha

Three providers are supported: Cloudflare Turnstile, hCaptcha, and reCAPTCHA v3. Pick one, set the secret, and start passing `captchaToken` on the protected mutations.

```graphql
mutation {
  configure(config: {
    captcha: { provider: turnstile, secret: "0x4AAA…" }
  }) { ok error { code developerMessage } }
}
```

Clients then attach the captcha token from the widget to the mutation:

```graphql
mutation {
  signUp(email: "u@example.com", password: "…", captchaToken: "0.aXR…") {
    ok
    error { code }
  }
}
```

Errors: `INVALID_CAPTCHA` when the token is missing, the score is below `threshold` (reCAPTCHA v3), or upstream rejects.

### Security notes

- The secret is **write-only** in the GraphQL schema and **encrypted at rest** with the tenant's `Providers` keychain.
- In the [audit log](./audit-log.md), `configure` calls record the rest of the input but redact `captcha.secret` to `***` — so you can see *when* the secret rotated without preserving the value.
- For reCAPTCHA v3, `threshold` is a score floor between 0.0 and 1.0; the default Google recommendation is `0.5`.

## Per-IP rate limits

Sliding-window limits backed by the `rate_limit_event` table. The raw key (IP) is SHA-256-hashed before storage so the table holds no PII at rest.

```graphql
mutation {
  configure(config: {
    rateLimits: {
      signUpPerIp:           { limit: 5,  window: "PT1H" },
      loginPerIp:            { limit: 20, window: "PT1H" },
      passwordResetPerIp:    { limit: 5,  window: "PT1H" },
      passwordlessInitPerIp: { limit: 5,  window: "PT1H" }
    }
  }) { ok }
}
```

- **Default is `limit: 0`**, which **disables** the scope. Existing deployments are not silently affected by upgrading to 2.2.
- The window is sliding — when 5 requests in an hour are reached, the next attempt fails until the oldest event ages out.
- A denied attempt does *not* extend the window. Only successful gating decisions are recorded as events. This matches "max N successful attempts per window".

When triggered, the mutation returns `RATE_LIMIT_EXCEEDED` with `retryAfter` in seconds.

### Which IP is counted?

The socket IP, unless the request is authenticated with an api_key that has `trustForwardedClientInfo` set and the proxy is sending `X-Contember-Client-IP`. See [proxy trust](./proxy-trust.md).

## Per-email exponential backoff

A second-layer protection that does not need any configuration of its own — it reuses the login backoff knobs:

- `login.baseBackoff`
- `login.maxBackoff`
- `login.attemptWindow`

Two flows are throttled per email:

- **Login** — failed `signIn` attempts for the same email back off exponentially. Returned to the client as `RATE_LIMIT_EXCEEDED` + `retryAfter`.
- **Mail-init** *(since 2.2)* — successful `createResetPasswordRequest` and `initSignInPasswordless` calls for the same email back off exponentially so the mailbox cannot be flooded. The mutation returns `ok: true` either way (silently — see below) but the mail is suppressed until the next allowed attempt.

A successful completion (`password_reset`, `passwordless_login`) resets the counter.

## HIBP password check

When enabled, every password-setting flow checks the password against the [Have I Been Pwned](https://haveibeenpwned.com/Passwords) corpus using its k-anonymity API (the first 5 hex chars of the SHA-1 hash are sent, never the password itself).

```graphql
mutation {
  configure(config: { password: { checkHibp: true } }) { ok }
}
```

- Applies to `signUp`, `changePassword`, `changeMyPassword`, `resetPassword`.
- Fails the mutation with `TOO_WEAK` and `COMPROMISED` in `weakPasswordReasons` when the password is in the corpus.
- **Fail-open**: when the HIBP API is unreachable or times out (1.5 s), the check is skipped — a network outage cannot lock users out of password changes.
- Works independently of `password.checkBlacklist`; you typically want both.

## Enumeration protection

Two orthogonal flags control how much the API leaks about an account on auth failure:

- **`login.revealUserExists`** — does the response distinguish "no such email" from "wrong password"?
- **`login.revealLoginMethod`** *(since 2.2)* — when an email exists, does the response distinguish "wrong password" from "this person has no password set" (i.e. they sign in via IDP or passwordless)? Also gates the `recommendedAction` hint on `signUp`'s `EMAIL_ALREADY_EXISTS`.

Both default to `true` (preserved for backwards compatibility). Privacy-conscious tenants typically set both to `false`.

When `revealUserExists: true` and `revealLoginMethod: true` (defaults):

| Flow | Unknown email | Wrong password | No password set (IDP/passwordless-only) |
|---|---|---|---|
| `signIn` | `UNKNOWN_EMAIL` | `INVALID_PASSWORD` | `NO_PASSWORD_SET` |
| `signUp` | (proceeds) | `EMAIL_ALREADY_EXISTS` + `recommendedAction` | — |
| `createResetPasswordRequest` | `PERSON_NOT_FOUND` | (proceeds) | — |
| `initSignInPasswordless` | `PERSON_NOT_FOUND` | (proceeds) | — |

When `revealUserExists: false` and `revealLoginMethod: false` (recommended for public tenants):

| Flow | Unknown email | Wrong password | No password set |
|---|---|---|---|
| `signIn` | `INVALID_CREDENTIALS` | `INVALID_CREDENTIALS` | `INVALID_CREDENTIALS` |
| `signUp` | (proceeds) | `EMAIL_ALREADY_EXISTS` (no `recommendedAction`; see below) | — |
| `createResetPasswordRequest` | `ok: true` | (proceeds) | — |
| `initSignInPasswordless` | `PASSWORDLESS_DISABLED` | (proceeds) | — |

The two flags can be mixed independently. `revealUserExists: false` alone still distinguishes `INVALID_PASSWORD` vs `NO_PASSWORD_SET`; `revealLoginMethod: false` alone still distinguishes `UNKNOWN_EMAIL` vs `INVALID_CREDENTIALS`.

### Sign-up enumeration

`signUp` is the one flow where `revealUserExists` does **not** mask existence — `EMAIL_ALREADY_EXISTS` is returned regardless. An earlier silent-success branch was tried and removed because `result === null` vs `result !== null` is trivially distinguishable, so it didn't actually close the oracle. For tenants that need to fully suppress sign-up enumeration the recommendation is to take `signUp` off the public login token and run the public flow through [invites](./invites.md) or [password reset](./password-reset.md). See [sign-up](./sign-up.md) for details.

## Recommended baseline

For any tenant exposed to the public internet:

- `password.checkBlacklist: true`, `password.checkHibp: true`
- `password.minLength: 12` or higher
- `login.revealUserExists: false`, `login.revealLoginMethod: false`
- Captcha provider configured
- Rate limits set for all four scopes

See [configuration → recommended hardening baseline](./configuration.md#recommended-hardening-baseline) for a copy-paste mutation.
