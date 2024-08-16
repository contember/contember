---
title: Content API overview
---

After Contember server starts, there will be more then single API available, but the Content API is the most important right now.

The Content API is a GraphQL API provided by Contember that is used to manage and access content in your project. It is available at a URL in the format `https://your-hostname/content/{project}/{stage}` (e.g. `http://localhost:1481/content/my-blog/live`). To access the API, you will need to obtain an access token with sufficient permissions from the [Tenant API](../tenant/overview.md). The token will look like `44d7dd8ae4a45c33eaa309716e41e1a8476cda4f`. This token should be passed in the Authorization header as a Bearer token.

:::tip
When running Contember locally, there is a superadmin token `0000000000000000000000000000000000000000` that can be used to access the Content API. 
:::

The GraphQL schema provided by the Content API is restricted based on the [ACL rules](../schema/acl.md) defined in your project. This means that the API will only include the types, fields, and mutations that are allowed based on the permissions granted to the user associated with the access token. For example, if you have defined a read-only role for a mobile application, the GraphQL API will not include any mutations for this role.

## GraphQL client

On [http://localhost:1481/playground](http://localhost:1481/playground) there is Apollo GraphQL playground running. But you can also try more advanced clients. Our choice is [Insomnia](https://insomnia.rest/).

Now you can discover how to read your data using [GraphQL queries](./queries.md) or modify them using [GraphQL mutations](./mutations.md). Subscriptions for watching data changes are currently not available.
