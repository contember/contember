---
title: API keys management
---

API keys serve as a way to authenticate applications where individual user identification and authentication are not required. They function as permanent access tokens.

## Create an API Key for a Project

You can create a project-specific API key using the GraphQL API:

```graphql
mutation {
  createApiKey(
    projectSlug: "my-blog",
    description: "User-friendly description of the key",
    memberships: [{role: "editor", variables: [{name: "language", values: ["cs"]}]}]
  ) {
    ok
    error {
      code
    }
    result {
      apiKey {
        id
        token
        identity {
          id
        }
      }
    }
  }
}
```

This returns three identifiers:

- **API Key ID**: Used for disabling this API key later.
- **Identity ID**: Used to modify the API key's memberships and permissions.
- **Token**: A bearer token used for authenticating your GraphQL requests.


## Create Global API Key

```graphql
mutation {
  createGlobalApiKey(
    description: "Global API key description",
    roles: ["super_admin", "monitor"]
  ) {
    ok
    error {
      code
    }
    result {
      apiKey {
        id
        token
        identity {
          id
        }
      }
    }
  }
}
```

This also returns three identifiers similar to creating a project-specific API key.

### Custom Token Generation

Both `createApiKey` and `createGlobalApiKey` support the optional `tokenHash` parameter. If you provide a SHA-256 hash of the token you wish to use, the API will not generate a new token, and the `token` field in the response will be empty. This allows you more control over token management but requires you to securely generate and store the original token yourself.

### Trusted-proxy API keys

:::note Available since 2.2
:::

Both `createApiKey` and `createGlobalApiKey` accept `options.trustForwardedClientInfo: true`. An api_key with that flag honors the `X-Contember-Client-IP` and `X-Contember-Client-User-Agent` headers from the request, so session tracking, audit logs and Content API `userInfo` see the real end-user IP/UA rather than the proxy's socket.

This is intended for backend services that proxy user requests. The flag carries a strict security contract on the proxy side — see [proxy trust](./proxy-trust.md) before enabling.

```graphql
mutation {
  createGlobalApiKey(
    description: "Backend → Contember (per-user)",
    roles: ["login"],
    options: { trustForwardedClientInfo: true }
  ) {
    ok
    result { apiKey { id token } }
  }
}
```

The flag cannot be flipped on an existing api_key. To remove it, disable the key and create a new one.

### Audit

*(since 2.2)* Every `createApiKey` / `createGlobalApiKey` is recorded as `api_key_create` in the [audit log](./audit-log.md) with the api_key id, identity, and memberships/roles — never the token or its hash. `disableApiKey` is recorded as `api_key_disable`.

## Add Global Roles to an Identity

```graphql
mutation {
  addGlobalIdentityRoles(
    identityId: "some-identity-id",
    roles: ["super_admin", "monitor"]
  ) {
    ok
    error {
      code
    }
  }
}
```

## Remove Global Roles from an Identity

```graphql
mutation {
  removeGlobalIdentityRoles(
    identityId: "some-identity-id",
    roles: ["monitor"]
  ) {
    ok
    error {
      code
    }
  }
}
```



## Session keys vs permanent keys

API keys come in two flavors:

- **Permanent** — created by `createApiKey` / `createGlobalApiKey`, no expiry, intended for applications and integrations.
- **Session** — minted by `signIn` / `signInIDP` / `signInPasswordless` / `createSessionToken`, short-lived, tied to a person. Documented in [sessions](./sessions.md) — there you'll also find how to list and revoke active sessions.

## Disable API Key

```graphql
mutation {
  disableApiKey(id: "some-api-key-id") {
    ok
  }
}
```

Use the API Key ID to disable the API key. Do not confuse this with the Identity ID.

To invalidate every API key (session and permanent) for a target person at once, use [`forceSignOutPerson`](./sessions.md#admin-force-sign-out).
