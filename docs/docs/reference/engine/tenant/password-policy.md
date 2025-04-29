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

## Best Practices

- Enforce a mix of character types for better entropy.
- Enable `checkBlacklist` to avoid trivial passwords.
- Use `pattern` if you require a specific password structure.

