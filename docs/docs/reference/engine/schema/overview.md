---
title: Project schema overview
---


Contember project schema defines schema of your model, ACL and validation rules.

<!--
TODO: PICTURE OF PROJECT SCHEMA, MODEL SCHEMA, ACL SCHEMA AND INPUT VALIDATION SCHEMA
-->

## Model schema

First let's look at the model schema, which is now the most important for us.

:::note 
Make sure you have `SchemaDefinition` imported in each file
```typescript
import { SchemaDefinition as def } from "@contember/schema-definition"
```
:::

### Entity

Basic unit in model schema is called entity. Each entity can have fields. There are two kind of fields - [columns](columns.md) holding a value and [relationships](relationships.md) to other entities.

Each entity is represented as a PostgreSQL table.

You define an entity by exporting a class from the schema definition file

```typescript
export class Post {}
```

You don't have to define a primary key, because every entity has "id" column by default.


### Columns

See [columns chapter](columns.md). 

### Relationships

Allow you to set relationship between different entities. See [relationships chapter](relationships.md).


## ACL schema

Defines user roles with permissions. For details see [dedicated ACL chapter](acl.md)

## Validation schema

Allows you to set additional validation constraints on GraphQL input. See [input validations](validations.md)


## Migrations

If you make a change in your project schema, you must create and apply [a migration](../migrations/overview.md)
