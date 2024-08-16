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



## Disable API Key

```graphql
mutation {
  disableApiKey(id: "some-api-key-id") {
    ok
  }
}
```

Use the API Key ID to disable the API key. Do not confuse this with the Identity ID.
