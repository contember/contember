---
title: Tenant configuration
---

The Tenant API exposes a single per-tenant configuration object covering password policy, login behavior, passwordless authentication, captcha, and rate limits. It is read via the `configuration` query and written via the `configure` mutation.

Every successful `configure` call is recorded in the [audit log](./audit-log.md) as a `tenant_config_change` event, with `captcha.secret` redacted to `***`.

## Reading configuration

```graphql
query {
  configuration {
    password {
      minLength
      requireUppercase
      requireLowercase
      requireDigit
      requireSpecial
      pattern
      checkBlacklist
      checkHibp
    }
    login {
      revealUserExists
      baseBackoff
      maxBackoff
      attemptWindow
      defaultTokenExpiration
      maxTokenExpiration
    }
    passwordless {
      enabled
      url
      expiration
    }
    captcha {
      provider
      threshold
    }
    rateLimits {
      signUpPerIp        { limit window }
      loginPerIp         { limit window }
      passwordResetPerIp { limit window }
      passwordlessInitPerIp { limit window }
    }
  }
}
```

The `captcha.secret` is intentionally **not** exposed by the schema — it is a credential, write-only.

## Writing configuration

```graphql
mutation {
  configure(config: {
    password: { minLength: 12, checkHibp: true, checkBlacklist: true },
    login: { revealUserExists: false, defaultTokenExpiration: "PT30M" },
    captcha: { provider: turnstile, secret: "0x4AAA…" },
    rateLimits: {
      signUpPerIp:           { limit: 5,  window: "PT1H" },
      loginPerIp:            { limit: 20, window: "PT1H" },
      passwordResetPerIp:    { limit: 5,  window: "PT1H" },
      passwordlessInitPerIp: { limit: 5,  window: "PT1H" }
    }
  }) {
    ok
    error { code developerMessage }
  }
}
```

All `ConfigInput` fields are optional and partial — unset fields preserve the current value.

Requires the `CONFIGURE` tenant permission. By default this is held by `SUPER_ADMIN`.

## Sections

### `password`

See [password policy](./password-policy.md) for individual fields and the `WeakPasswordReason` enum returned with `TOO_WEAK` errors.

| Field | Default | Notes |
|---|---|---|
| `minLength` | `8` | |
| `requireUppercase`, `requireLowercase`, `requireDigit`, `requireSpecial` | `0` | Minimum count of each character class |
| `pattern` | `null` | Optional regex; pattern violations yield `INVALID_PATTERN` |
| `checkBlacklist` | `true` | 10k-most-common list with leetspeak normalization |
| `checkHibp` | `false` | HIBP k-anonymity check; opt-in. See [anti-abuse](./anti-abuse.md#hibp-password-check). Available since 2.2. |

### `login`

| Field | Default | Notes |
|---|---|---|
| `revealUserExists` | `true` | When `false`, all sign-in / sign-up / reset / passwordless-init failures look identical to the caller. See [anti-abuse — enumeration protection](./anti-abuse.md#enumeration-protection). |
| `baseBackoff` | `PT1S` | Starting backoff between per-email login attempts. Also drives the per-email mail-init throttle for password reset and passwordless init. |
| `maxBackoff` | `PT1M` | Upper bound for the exponential backoff. |
| `attemptWindow` | `PT5M` | How long failed attempts are remembered. |
| `defaultTokenExpiration` | `PT30M` | Session token lifetime when the client omits `expiration`. |
| `maxTokenExpiration` | `6 months` | Hard cap on client-requested `expiration`. |

Intervals follow ISO 8601 duration syntax (`PT5M`, `PT1H`, `P1D`, …).

### `passwordless`

See the [passwordless](./passwordless.md) page.

### `captcha` *(since 2.2)*

See [anti-abuse — captcha](./anti-abuse.md#captcha).

| Field | Notes |
|---|---|
| `provider` | `turnstile`, `hcaptcha`, or `recaptchaV3`. `null` disables captcha. |
| `secret` | **Write-only.** The provider's server-side secret. Encrypted at rest with the tenant's `Providers` keychain. Passing `null` leaves the stored value unchanged; passing `""` clears it. |
| `threshold` | reCAPTCHA v3 score threshold (0.0–1.0). Ignored for hCaptcha / Turnstile. |

### `rateLimits` *(since 2.2)*

Sliding-window per-IP limits. `limit: 0` (the default) disables that scope. See [anti-abuse — rate limits](./anti-abuse.md#per-ip-rate-limits).

| Scope | Applied to |
|---|---|
| `signUpPerIp` | `signUp` |
| `loginPerIp` | `signIn`, `signInIDP`, `signInPasswordless` |
| `passwordResetPerIp` | `createResetPasswordRequest` |
| `passwordlessInitPerIp` | `initSignInPasswordless` |

## Recommended hardening baseline

```graphql
mutation {
  configure(config: {
    password: { minLength: 12, checkBlacklist: true, checkHibp: true },
    login:    { revealUserExists: false },
    captcha:  { provider: turnstile, secret: "…" },
    rateLimits: {
      signUpPerIp:           { limit: 5,   window: "PT1H" },
      loginPerIp:            { limit: 20,  window: "PT1H" },
      passwordResetPerIp:    { limit: 5,   window: "PT1H" },
      passwordlessInitPerIp: { limit: 5,   window: "PT1H" }
    }
  }) { ok error { code developerMessage } }
}
```

For most tenants this is enough to make brute-force, password-spray, and enumeration attacks impractical without affecting legitimate users.
