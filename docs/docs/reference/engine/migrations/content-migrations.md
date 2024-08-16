---
title: Content Migrations
---

# Content Migrations in Contember

## Introduction

Content migrations within Contember are designed to manage and transform the existing data in your database. This is achieved using GraphQL queries, which provide a powerful and versatile approach to data manipulation.

## Setting Up Content Migration Files

Content migration files should be added to the `api/migrations` directory in your Contember project. The naming convention for these files is `YYYY-MM-DD-HHMMSS-label`, which ensures they are executed in the correct order and are easy to identify.

Example File Name: `2023-10-26-150000-add-english-locale.js`


### Using the CLI to create blank migration files

You can use the Contember CLI to create blank migration files. Simply run the following command and provide a label for your migration.

```bash
yarn contember migration:blank <label>
```

Depending on the complexity of your migration, you can choose to use a JSON, JavaScript (JS), or TypeScript (TS) file. By default, the CLI will create a TypeScript file.

## Defining Migrations in JSON

Content migrations can be defined in JSON, using a single "query" or an array of "queries".

### Single Query Example

```json
{
  "query": "mutation { createLocale(data: { code: \"en\" }) { ok errorMessage } }"
}
```

### Multiple Queries Example

```json
{
  "queries": [
    {
      "query": "mutation { createLocale(data: { code: \"en\" }) { ok errorMessage } }"
    },
    {
      "query": "mutation { createLocale(data: { code: \"fr\" }) { ok errorMessage } }"
    }
  ]
}
```

## Defining Migrations in JavaScript or TypeScript

For more advanced use cases, JS or TS can be used to define migrations.

### Single Query with Variables

```typescript
export default {
  query: `
    mutation CreateLocale($data: LocaleCreateInput) {
      createLocale(data: $data) {
        ok
        errorMessage
      }
    }
  `,
  variables: {
    data: {
      code: "en"
    }
  }
};
```

### Multiple Queries with Variables

```typescript
export default {
  queries: [
    {
      query: `
        mutation CreateLocale($data: LocaleCreateInput) {
          createLocale(data: $data) {
            ok
            errorMessage
          }
        }
      `,
      variables: {
        data: {
          code: "en"
        }
      }
    },
    { 
      // Second query
    }
  ]
};
```

:::tip Using named exports
Instead of default export, you can use named exports "queries" and "query" to define migrations.
:::

## Utilizing Functions in Migrations

Functions in migration files provide a higher level of control and the ability to perform dynamic operations.

```typescript
export default async function () {
  // Fetch data, execute queries, and perform other asynchronous operations here.

  // Return content migrations if needed
  return {
    queries: [
        // Individual queries
    ]
  };
};
```

## Validating Mutation Results

It's crucial to fetch the "ok" and "errorMessage" fields for top-level mutations to ensure they have executed successfully. Contember CLI checks these fields by default, but you can bypass this check (not recommended) by including `checkMutationResult: false` in your query object.

## Applying Migrations

To run your content migrations, use the Contember CLI’s `migration:execute` command.

```bash
npx contember migration:execute
```

### Execution Model for Function Migrations

Function migrations introduce a unique execution model. The CLI orchestrates the migrations, grouping non-function migrations into a single transaction, while function migrations are executed separately, each in its own transaction.

**Execution Flow Example**:

- **Transaction 1**:
  - Schema Migration A
  - Content Migration B
  - Schema Migration C

- **Function Migration** (Separate Transaction):
  - Execute exported function and await result
  - If the function returns content migrations, send them to the migration API

- **Subsequent Non-Function Migrations** (New Transaction)

**Note**: Due to this model, it’s advisable to run function migrations independently to avoid complications, as some migrations might succeed even if others fail.
