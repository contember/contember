---
title: Overview of Tenant API
---

The Contember Tenant API is a specialized GraphQL API designed for the centralized management of **projects**, **tokens**, **users**, and their respective **roles**. Unlike the [Content API](../content/overview.md), the Tenant API is shared across all projects and is accessible via the URL `https://engine-hostname/tenant`. To interact with this API, a `Bearer` token must be supplied in the `Authorization` header.

## Key Concepts

- **Identity**: Contains information regarding roles and project memberships.
- **Person**: Associated with an identity and possesses credentials (email and password) for authentication.
- **Authorization Key/Token**: Serves as either a permanent (for applications) or session-based (for users) authorization token tied to a specific identity. This token is verified using a Bearer token.

## Authorization Mechanisms

Much like the Content API, the Tenant API requires an authorization token for every request, including login operations.

The default keys for the `login` and `super_admin` roles are configured via the environment variables `CONTEMBER_LOGIN_TOKEN` and `CONTEMBER_ROOT_TOKEN`. For local development setups, these keys can be found in the `docker-compose.yaml` file.

The login token can be employed for various sign-in methods, including email/password-based and Identity Provider (IdP) authentication, as well as for password reset operations.

There are primarily two types of authorization tokens:

- **Permanent API Token**: Generally used in application settings where user authentication is not required. [This token can be generated through Tenant API mutations](api-keys.md).

- **Session Token**: Obtained when a user successfully signs in and is typically used for tracking individual user actions within administrative interfaces.

## Choosing the Right Token

Choosing the appropriate token for specific actions can sometimes be confusing. Here's a step-by-step example to clarify how to generate an API token for an application to read data from the Content API:

1. **Locate the Login Token**: Retrieve your default login token, usually found in your environment configuration.

2. **Sign In**: Use the retrieved login token as a Bearer token and execute the `signIn` mutation against the Tenant API.

3. **Session Token**: Upon successful sign-in, you'll receive another token—this is your session token, which has a limited validity period.

4. **Create API Key**: Execute the `createApiKey` mutation against the Tenant API, this time using your newly acquired session token.

5. **Retrieve Permanent API Token**: The mutation will return a new, permanent API token configured with the permissions you have set.

6. **Interact with Content API**: You can now use this permanent API token to execute queries against the Content API.
