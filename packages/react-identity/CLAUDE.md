# react-identity

Authorization and authentication components for role-based rendering.

## Core Components

- `HasRole` — conditional rendering based on user roles (string match or custom function)
- `IdentityEnvironmentProvider` — provides identity data to binding environment

## Key Hooks

- `useProjectUserRoles()` — get current user's project roles

## Environment Extensions

- `identityEnvironmentExtension` — injects identity data into binding environment
- `projectEnvironmentExtension` — provides project slug for role context

Works with `@contember/react-client-tenant` for tenant/identity data and `EnvironmentExtensionProvider` from react-binding.
