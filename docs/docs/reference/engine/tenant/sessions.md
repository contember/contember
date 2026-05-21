---
title: Sessions
---

A session is a short-lived `SESSION`-type API key bound to an identity. It is created on a successful sign-in (`signIn`, `signInIDP`, `signInPasswordless`, or `createSessionToken`), extended on every request the client makes, and ends when the user signs out, the token expires, an admin force-signs-out the person, or the user revokes the session by id.

:::note Available since 2.2
The session listing, session-revoke, and force-sign-out mutations, plus the IP / User-Agent / `last_used_at` tracking columns, ship in engine **2.2**. Earlier versions only supported `signOut(all: true)` and silent expiry.
:::

For everything related to the *creation* of a session (sign-in flows, login configuration, sign-out), see [sign-in](./sign-in.md).

## Listing sessions

Active sessions live on the `Identity` type. The `me` query returns the caller's own identity:

```graphql
query {
  me {
    id
    sessions {
      id
      createdAt
      expiresAt
      lastUsedAt
      lastIp
      lastUserAgent
      createdIp
      createdUserAgent
      isCurrent
    }
  }
}
```

`Identity.sessions` is also reachable through `personById(id) { identity { sessions } }` and `projectBySlug { members { identity { sessions } } }`. The owning identity always sees its own sessions; reading someone else's requires the `person:viewSessions` permission against the target's roles — `SUPER_ADMIN` sees everyone, `PROJECT_ADMIN` sees members whose roles fall within their allowed-input-roles, anyone else with an explicit ACL grant for `person:viewSessions` sees within the configured scope. When the caller lacks visibility on a particular identity the field returns an empty list rather than throwing, so batched queries don't abort on a single forbidden target.

### `SessionInfo` fields

| Field | Notes |
|---|---|
| `id` | The session's API-key id. Pass to `revokeSession`. |
| `createdAt` | When the session was minted. |
| `expiresAt` | Current expiration. Each authenticated request extends this, throttled to once per 60 seconds. |
| `lastUsedAt` | Timestamp of the most recent request on this session. |
| `lastIp`, `lastUserAgent` | Client info from the most recent request. Updated immediately on IP or User-Agent change, otherwise throttled to once per 60 s. |
| `createdIp`, `createdUserAgent` | Client info captured at sign-in time. |
| `isCurrent` | `true` for the session that signed the current request. |

When [trust-forwarded-info](./proxy-trust.md) is in effect on the session's api_key, the IP/UA columns reflect the *forwarded* (real user) values, not the proxy's socket.

## Revoking your own session

```graphql
mutation {
  revokeSession(sessionId: "…") {
    ok
    error { code }
  }
}
```

Errors:

| Code | Cause |
|---|---|
| `SESSION_NOT_FOUND` | The id doesn't exist, doesn't belong to the caller, or isn't a SESSION-type key. |
| `NOT_A_PERSON` | Called with a permanent API key. Only persons can revoke. |

Recorded in the [audit log](./audit-log.md) as `session_revoked_by_user` with `metadata.sessionId`.

You can revoke any of your own sessions, including the current one. To end *all* of your sessions in one call, use `signOut(all: true)` (see [sign-in](./sign-in.md#signing-out)).

## Admin: force sign-out

Administrators with the `PERSON_FORCE_SIGN_OUT` permission can invalidate every API key (session and permanent) for a target person. Same role-escalation rules as `disablePerson`: a `PROJECT_ADMIN` can force-sign-out persons whose roles do not exceed their own, `SUPER_ADMIN` is unrestricted.

```graphql
mutation {
  forceSignOutPerson(
    personId: "…",
    reason: "Suspicious activity from 198.51.100.7"
  ) {
    ok
    error { code }
  }
}
```

The `reason` is optional; when provided it lands in `metadata.reason` of the audit entry and is also passed to the `FORCED_SIGN_OUT` mail variables.

Errors:

| Code | Cause |
|---|---|
| `PERSON_NOT_FOUND` | The target person does not exist. |

### Side effects

- All of the target's API keys (session and permanent) are disabled.
- A `FORCED_SIGN_OUT` mail is sent to the target's email if one is set. See [mail templates](./mail-templates.md) for variables and customization.
- An entry of type `forced_sign_out` is written to the audit log with `target_person_id` set and `metadata.reason`.

Note: `forceSignOutPerson` disables permanent keys too. If your operator needs to disable a single permanent integration token without affecting human sessions, use `disableApiKey`.

## Session lifecycle, in one diagram

```
   sign-in flow                 every request                    end
       │                             │                            │
       ▼                             ▼                            ▼
   create api_key            verify token, extend          revokeSession (self)
   - createdIp/UA            expires_at (60 s throttle)    signOut(all)
   - identity_id             update last_ip/UA/used_at     forceSignOutPerson (admin)
   - expires_at              (immediately if IP/UA         api_key.disabled_at = now()
                              changed, else throttled)     expiration window passes
```

## Per-key trust-forwarded-info

Whether a session's tracking columns reflect the real user or the proxy depends on whether the api_key has `trustForwardedClientInfo` and the proxy is sending `X-Contember-Client-*` headers. See [proxy trust](./proxy-trust.md).
