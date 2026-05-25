---
title: Commands for development
---

During local development, there may be a need to bypass certain checks, even if the migration has already been executed locally. This section details several commands that provide flexibility and control over your local migration process.

Please be aware that these commands are available exclusively on your local Contember instance and are not meant for production environments.

### Amending a Migration

While developing a new feature, you might find yourself needing to adjust an already created and applied schema migration. Instead of creating an entirely new diff, you can utilize the `migrations:amend` command. This command allows you to update the most recent migration both on disk and in your local Contember instance. If you revert the schema changes and run `migrations:amend`, the command effectively removes the migration.

#### Example: Amending Latest Migration

```bash
npm run contember migrations:amend
```

#### Example: Amending Specific Migration

You can target a specific migration to amend by providing an additional argument, as shown below:

```bash
npm run contember migrations:amend 2022-01-17-101806-test
```

:::note
If the migration has already been run by someone else or it's been deployed, it won't be possible to execute the amended migration.
:::

### Rebasing a Migration with `migrations:rebase`

Before merging a branch with a new migration, you might find that a new migration has been added upstream. The `migrations:rebase` command assists in resolving this by renaming the migrations both on disk and in your local Contember instance. Simply pass the names of the migrations you need to merge.

#### Example

```bash
npm run contember migrations:rebase 2022-01-17-101806-test
```

### Force Execution of Out-of-Order Migrations

When you pull code from upstream, there may be a new migration that precedes your local migrations. To bypass this, you can run the `migrations:execute` command with the `--force` flag.

#### Example: Force Executing

```bash
npm run contember migrations:execute --force
```

### <span className="version">Engine 1.3+</span> Executing Migrations Until a Specific Point with `--until`

In your development process, you might need to run a series of migrations up to a certain point. The `migrations:execute` command now allows you to use the `--until` flag for this purpose. This option executes all migrations up to and including the specified migration.

#### Example: Executing Until a Specific Migration

```bash
npm run contember migrations:execute --until 2022-01-17-101806-test
```



