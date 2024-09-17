# @contember/vite-plugin

## Overview

`@contember/vite-plugin` is a Vite plugin designed to enhance the Vite build process for Contember applications. It provides configuration options and middleware to streamline the development and build processes.

## Installation

```bash
yarn add @contember/vite-plugin
```

## Usage

```javascript
import { defineConfig } from 'vite'
import { contember } from '@contember/vite-plugin'

export default defineConfig({
  plugins: [contember()]
})
```

## Options

The plugin accepts an optional `ContemberOptions` object:

```typescript
type ContemberOptions = {
  buildVersion?: boolean
  disableMiddleware?: boolean
  appPath?: string
}
```

- `buildVersion`: (Optional) When `true` (default), adds a build version meta tag to the HTML output.
- `disableMiddleware`: (Optional) When `true`, disables the built-in middleware.
- `appPath`: (Optional) Specifies the application path. Defaults to `/app`.

## Features

### 1. Project Name Injection

The plugin automatically detects the Contember project name from the command-line arguments and injects it into the application as an environment variable:

```javascript
import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME
```

### 2. Build Configuration

- Sets the base URL to `/`.
- Configures the build input to include both the root and app HTML files.

### 3. Development Server Middleware

Unless disabled, the plugin adds middleware to handle routing for the app path, ensuring that requests to the app are properly handled.

### 4. Build Version Tagging

When enabled (default), the plugin adds a meta tag to the HTML output with a unique build version hash:

```html
<meta name="contember-build-version" content="[MD5_HASH]">
```
This is used for outdated application check.

## TypeScript Support

The plugin includes TypeScript definitions and is configured to work with TypeScript projects.

## Compatibility

This plugin is compatible with Vite versions 4 and 5.
