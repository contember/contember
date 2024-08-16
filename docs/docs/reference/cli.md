---
title: Contember CLI
---

There is a command line tool, which helps you with developing Contember projects and running them.

Run it without any args to see a help
```text
npm run contember
``` 
Which will print the available commands
```text
Contember CLI version X.Y.Z
Usage: <command> <command args>
    deploy                   Deploy Contember project
    migrations:amend         Amends latest migration
    migrations:describe      Describes a migration
    migrations:diff          Creates schema migration diff for given project
    migrations:execute       Executes migrations on an instance
    migrations:rebase        Rebase migrations on filesystem and in local instance
    migrations:status        Shows status of executed migrations on an instance & sync status
    project:create           Creates a new Contember project
    project:print-schema     Prints project schema
    project:validate         Validates project schema
    tenant:create-api-key    Creates an API key
    tenant:invite            Invites a user by an email
    tenant:reset-password    Resets user password
    tenant:sign-in           Signs in a user
    version                  Prints Contember CLI version
    workspace:update:api     Updates Contember API version and all related packages
```

## Commands
:::tip
You can use non-ambiguous abbreviation for commands,
for example `npm run contember migr:exe`, which runs `migrations:execute` command
:::

### migrations:diff

See [migrations chapter](/reference/engine/migrations/overview.md).
