# react-routing

Routing system with URL parameter binding and query string management.

## Core Components

- `RoutingProvider` — root provider managing route context
- `Pages` / `Page` — route container and definitions
- `Link` / `RoutingLink` — link components with parameter resolution
- `DimensionLink` — links with dimension support

## Key Hooks

- `useRoutingLink()` — generate links with parameter resolution
- `useCurrentRequest()` — access current route state
- `usePushRequest()` — navigate programmatically
- `useAddRequestChangeListener()` — listen to route changes

## Features

- URL pattern matching via `path-to-regexp`
- Custom parameter serialization (`paramsToObject`/`objectToParams`)
- `RoutingParameterResolver` for dynamic parameter extraction from binding context
- Dimension support for responsive layout breakpoints
