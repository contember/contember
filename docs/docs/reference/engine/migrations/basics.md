---
title: Migrations workflow
---

### Creating a diff using `migrations:diff`

After you update your schema, you need to create a migration for your change, otherwise Contember won't see it.

There is a command to rescue you:

```bash
npm run contember migrations:diff <migration name>
```

#### Example: creating a diff

```bash
npm run contember migrations:diff add-categories
```

:::note
Name of a migration can only contain alphanumeric letters and a dash
:::

Contember will show you individual migration steps and ask you for confirmation.

You should check the steps with caution, because Contember cannot detect some changes correctly and it may result in a loss of your data. For example when you rename a field it drops the field and creates a new one.

If you have chosen to execute migration, you are done for now. If you haven't, you can check created `.json` file and [modify migration](./advanced/writing-schema-migrations.md) file manually describing the change more precisely.

### Explaining a migration using `migrations:describe`

You can again verify individual migration steps using `migrations:describe`. You can use `--sql-only` and `--no-sql` to alter output of the command.

#### Example: explaining migrations steps

```bash
npm run contember migrations:describe
```

### Executing migrations using `migrations:execute`

If you've pulled new migrations from upstream, or you want to execute a migration, you've created, you can apply all pending migrations using `migrations:execute`

#### Example: executing migrations

```bash
npm run contember migrations:execute
```

All the changes will be applied to both Contember schema and PostgreSQL database.

:::note
To execute migrations, you need [appropriate permissions](../schema/acl.md#migrations).
:::
