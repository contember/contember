# Contember API

Typesafe GraphQL API for managing content and data.

## Overview

This API project defines the data model and permissions for the Contember API. It is built with the Contember platform, a headless CMS that provides a powerful GraphQL API for managing content and data.

## Project Structure

```
├── migrations/                # Database migrations
└── model/                     # Data model definitions
```

- **`migrations/`**: Stores database migration scripts to manage schema changes and data migrations.
- **`model/`**: Contains the definitions for entities, fields, relations, and permissions.

---

## Key Concepts

### Migrations
Database schema changes are managed through **migrations**. These include both schema alterations and data transformations. Use the Contember CLI to create, amend, or execute migrations.

### Data Model
Defines your application's **entities**, **fields**, **relations**, and **permissions**, serving as the blueprint for your GraphQL API.

---

## Using the Contember CLI

The **Contember CLI** is a command-line tool for managing migrations, the data model, and permissions. For detailed guidance, see the [Contember CLI Documentation](https://docs.contember.com/reference/cli/).

To view all available commands, run:
```bash
yarn run contember
```

---

### Common Commands

Run these commands from the root of the project directory.

#### Amend the Latest Migration
Modify the most recent migration file to refine your changes:
```bash
yarn run contember migrations:amend
```

#### Generate a Schema Migration Diff
Create a migration diff for a specific project:
```bash
yarn run contember migrations:diff <migration-name>
```

#### Execute Migrations
Apply migrations to a Contember instance:
```bash
yarn run contember migrations:execute
```

#### Shortcut Commands
All commands support minimal unique prefixes. For example:
- `yarn run contember m:a` → Shortcut for `migrations:amend`
- `yarn run contember m:d` → Shortcut for `migrations:diff`

[Contember CLI Reference](https://docs.contember.com/reference/cli/)

---

# How to work with Actions locally

To test or debug Actions with a local Cloudflare worker running on http://localhost:8787, you need to access the worker from within the Docker container. Docker uses a special DNS name, `host.docker.internal`, which resolves to the host machine's internal IP address.

For example, to set up a Contember Action that communicates with the worker, use the following configuration:
```
@c.Watch({
  name: 'action_name',
  watch: `fields_to_watch`,
  webhook: 'http://host.docker.internal:8787',
  selection: 'optional_selection_for_payload',
})
```

[Contember Actions Documentation](https://docs.contember.com/reference/engine/actions/definition)
