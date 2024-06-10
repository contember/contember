---
title: Overview
---
# Overview of Contember Migrations


Contember is a powerful platform that simplifies the development of content-driven applications. One of its core features is the ability to handle database schema changes over time through migrations. Migrations in Contember are crucial for maintaining consistency and functionality as your application evolves.

## Types of Migrations

There are primarily two types of migrations in Contember:

1. **Schema Migrations**: These migrations deal with changes in the database schema, such as adding or removing tables, columns, or relationships.

2. **Content Migrations**: These migrations handle changes in the content stored in the database. This could involve transforming data, populating new fields, or cleaning up old data.

Both types of migrations ensure that changes to the application’s database are carried out systematically, safely, and can be replicated across different environments.

## CLI Commands

Contember provides a set of Command Line Interface (CLI) commands to facilitate the migration process. These commands help developers to generate, apply, describe, and manage migrations efficiently. Some of the basic commands include:

- `migrations:diff`: Generates a new migration based on the differences between the current schema and the existing database structure.
- `migrations:execute`: Applies pending migrations.
- `migrations:describe`: Provides a detailed description of a specific migration.

:::note
To execute migrations, you need [appropriate permissions](../schema/acl.md#migrations).
:::

## Contember needs migrations for everything, even ACL

In Contember, it’s imperative to note that all changes made to the schema, including changes in the Access Control List (ACL), must produce a schema migration. This ensures that the changes are trackable, reversible, and consistent across all environments. It also helps in maintaining the integrity of the application and its data.

In the following sections of this documentation, we will delve deeper into each aspect of migrations, providing you with the knowledge and tools you need to manage your Contember application successfully.

## Migration constraints

Contember includes constraints to prevent database inconsistencies. Namely:

- you can't change content of executed migration
- you can't execute a migration, which precedes already executed migration

Therefore, you should:

- never modify or delete a migration, which has been executed on live environment,
- ensure, that new migration is always last (e.g. when merging a branch).
