---
title: Password Policy
---

Controlling the strength of user passwords is essential for maintaining security in your application. Contember allows you to define a custom password policy via the `configure` mutation. This includes settings like minimum length, character requirements, and optional pattern enforcement.

## Configuring Password Requirements

You can set or update password policy rules using the `configure` mutation and its `password` field. Here's an example:

```graphql
mutation {
  configure(config: {
    password: {
      minLength: 10
      requireUppercase: 1
      requireLowercase: 1
      requireDigit: 1
      requireSpecial: 1
      checkBlacklist: true
      pattern: "^(?=.*[A-Z])(?=.*\\d).*$"
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

### Available Fields

- **minLength** – Minimum number of characters required (e.g., `8`)
- **requireUppercase** – Minimum uppercase letters (e.g., `1`)
- **requireLowercase** – Minimum lowercase letters (e.g., `1`)
- **requireDigit** – Minimum digits required (e.g., `1`)
- **requireSpecial** – Minimum special characters required (e.g., `1`)
- **checkBlacklist** – Whether to block commonly used or leaked passwords (`true` or `false`)
- **checkHibp** – Whether to check the password against the Have I Been Pwned corpus *(since 2.2)*. See [HIBP check](#hibp-check) below.
- **pattern** – Optional regex pattern that passwords must match (e.g., enforce structure)

## Blacklist: Preventing Common Passwords

When `checkBlacklist` is enabled, passwords are checked against a list of [10,000 most common passwords](https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10k-most-common.txt), sourced from the [SecLists project](https://github.com/danielmiessler/SecLists). This helps block weak passwords like `qwerty`, or `123456`.

### Normalization and Leetspeak Decoding

To ensure better coverage, basic normalization is applied before blacklist comparison. This includes:

- Lowercasing the password
- Decoding common leetspeak substitutions:
  - `@` → `a`
  - `$` → `s`
  - `0` → `o`
  - `1` → `l`
  - `3` → `e`
  - `7` → `t`
  - `!` → `i`

For example, `P@ssw0rd` would be flagged as `password` after normalization and leetspeak decoding.

## HIBP check

:::note Available since 2.2
:::

When `checkHibp` is enabled, every password-setting flow (`signUp`, `changePassword`, `changeMyPassword`, `resetPassword`) is checked against the [Have I Been Pwned](https://haveibeenpwned.com/Passwords) corpus using its k-anonymity API: only the first 5 hex chars of the password's SHA-1 hash are sent to HIBP, never the password itself.

```graphql
mutation {
  configure(config: { password: { checkHibp: true } }) { ok }
}
```

Compromised passwords are rejected with `TOO_WEAK` and a `COMPROMISED` entry in `weakPasswordReasons`.

The check is **fail-open**: if HIBP is unreachable or times out (1.5 s), the check is skipped — a network outage cannot lock users out of password changes. `checkHibp` and `checkBlacklist` are independent; you typically want both on.

## Weak Password Feedback

If a password doesn't meet the policy, you'll receive a `TOO_WEAK` error with a list of reasons:

```graphql
mutation {
  changeMyPassword(currentPassword: "oldPass", newPassword: "weak") {
    ok
    error {
      code
      weakPasswordReasons
      developerMessage
    }
  }
}
```

### Example Weak Password Reasons

- `TOO_SHORT`
- `MISSING_UPPERCASE`
- `MISSING_LOWERCASE`
- `MISSING_DIGIT`
- `MISSING_SPECIAL`
- `INVALID_PATTERN`
- `BLACKLISTED`
- `COMPROMISED` *(since 2.2)* — password found in the HIBP corpus

## Best Practices

- Enforce a mix of character types for better entropy.
- Enable `checkBlacklist` to avoid trivial passwords.
- Enable `checkHibp` to also block passwords known from public breaches.
- Use `pattern` if you require a specific password structure.

See [anti-abuse](./anti-abuse.md) for the broader picture of how password policy interacts with rate limits, captcha, and enumeration protection.

