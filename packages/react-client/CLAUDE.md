# react-client

React integration for Contember GraphQL clients. Provides hooks and contexts for API access.

## Key Hooks

- `useGraphQlClient()` — generic GraphQL client
- `useContentGraphQlClient()` — content API client
- `useSystemGraphQlClient()` — system API client
- `useTenantGraphQlClient()` — tenant API client
- `useCurrentContentGraphQlClient()` / `useCurrentSystemGraphQlClient()` — workspace-scoped clients

## Key Contexts

- `SessionTokenContext` / `SetSessionTokenContext` — authentication token management
- `ApiBaseUrlContext` — API endpoint
- `LoginTokenContext` — login-specific token
- `ProjectSlugContext` / `StageSlugContext` — current workspace context
- `GraphQlClientFactoryContext` — custom client factory

## Architecture

Wraps `@contember/graphql-client` and `@contember/client-content` with React context for workspace-aware client instantiation.
