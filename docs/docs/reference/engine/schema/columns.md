---
title: Columns
---

To define columns in Contember, you can add properties to your entity class. Each property should be defined using a column definition method that specifies the data type for the column.

#### Example how to define columns for a Post entity:

```typescript
export class Post {
	title = def.stringColumn().notNull()
	publishedAt = def.dateTimeColumn()
}
```

In this example, the Post entity has two columns: title and publishedAt. The title column is a string column that is defined as not nullable, while the publishedAt column is a date-time column.

## Supported data types

Contember supports several different data types for columns, including string, int, double, bool, dateTime, date, json, and uuid. You can use the following methods to define columns of different types:

| Contember Type | Definition method | PostgreSQL type  | Description
| -------------- | ------------------| ---------------- | -----------
| String         | stringColumn      | text             | Generic text field with arbitrary length.
| Int            | intColumn         | integer          | Stores whole signed numbers (32b default)
| Double         | doubleColumn      | double precision | Floating point numbers according to IEEE 64-bit float.
| Bool           | boolColumn        | boolean          | Binary true/false value.
| DateTime       | dateTimeColumn    | timestamptz      | For storing date and time, converted to UTC by default and transferred in ISO 8601 format (e.g. `2032-01-18T13:36:45Z`).
| Date           | dateColumn        | date             | Date field without a time part. It's transferred in `YYYY-MM-DD` format (e.g. `2032-01-18`).
| Json           | jsonColumn        | jsonb            | Stores arbitrary JSON.
| UUID           | uuidColumn        | uuid             | Universally unique identifier, used for all primary keys by default.
| Enum           | enumColumn        | *custom domain*  | Field with predefined set of possible values. [See more in a section below.](#enums)

:::note
The type of column in PostgreSQL database can be changed using `.columnType(...)` in schema definition.
#### Example: changing database type of Json column
```typescript
export class Post {
	config = def.jsonColumn().columnType('json')
}
```
:::


## Column flags and options

In addition to defining the data type for a column, you can also specify additional flags such as nullability and uniqueness.


### Not null fields

By default, columns are nullable, meaning that they can store a `null` value. However, you can specify that a column is not nullable by calling the `.notNull()` method on the column definition.

#### Example how to define a not-null string column:

```typescript
title = def.stringColumn().notNull()
```

In this example, the title column is a string column that is defined as not nullable. This means that you must provide a value for the title column when you create a record in the Post entity.

### Unique fields

You can mark a column as unique by calling the `.unique()` method on it:

```typescript
slug = def.stringColumn().unique()
```

You can also define composite unique keys by using a class decorator:

```typescript
@def.Unique("locale", "slug")
export class Post {
	slug = def.stringColumn().notNull()
	locale = def.stringColumn().notNull()
}
```

:::tip
You can also reference relationships in `Unique`.
:::

You can then use these unique combinations to [fetch a single record](../content/queries.md#fetching-a-single-record).
"One has one" relationships are marked as unique by default.

### Indexes

To define ordinary non-unique index, you can use `Index` decorator in your schema definition.

#### Example how to define a single column index
```typescript
@def.Index('title')
export class Article {
	title = def.stringColumn()
}
```

#### Example how to define a multi column index
```typescript
@def.Index('title', 'description')
export class Article {
	title = def.stringColumn()
	description = def.stringColumn()
}
```

### Changing column name

To change the name of a column in a database, you can use the `columnName` method on the column definition. By default, Contember will use the "snake case" version of the property name as the column name in the database.

#### Example how to define a column with a custom column name:

```typescript
publishedAt = def.dateTimeColumn().columnName('published')
```
In this example, the publishedAt property is a date-time column that is defined with the column name `published`. This means that the column will be named `published` in the database, rather than `published_at`.

It is worth noting that when working with Contember, you will typically interact with the GraphQL schema rather than the underlying database schema. This means that you will usually use the property names defined in your entity classes to query and manipulate data, rather than the column names in the database. You usually only use database column names in custom views.

You might use the columnName method to maintain backward compatibility when making changes to your schema. For example, if you need to rename a field name in your schema, you can use the columnName method to keep old column name in your database. This can help to minimize the impact of schema changes on your application.


### Changing column type

The `columnType` method allows you to specify the underlying column type in the database for a column in your entity schema. By default, Contember will map the column types in your entity schema to the appropriate column types in the database based on the data type of the property.

However, you can use the columnType method to specify a custom column type in the database for a column. This can be useful if you need to use a column type in the database that is not supported by Contember, or if you need to customize the mapping between the column types in your schema and the database.

#### Example how to use the columnType method to specify a custom column type in the database:

```typescript
config = def.jsonColumn().columnType('json')
```
In this example, the config property is a JSON column that is defined with the column type json in the database. This means that the config column will be of type json in the database, rather than the default jsonb type.

### Default value

The `default` method allows you to specify a default value for a column in your entity schema. When a default value is specified, it will be used as the value of the column when a new record is created if no value is explicitly provided.

#### Example how to use the default method to specify a default value for a column:
```typescript
published = def.boolColumn().default(false)
```
In this example, the published property is a boolean column that is defined with the default value false. This means that when a new record is created, the published column will be set to false if no value is explicitly provided.

The `default` method can be used with any column type that supports default values in the database. For example, you can use the `default` method with string, integer, double, and boolean columns, as well as with enum and JSON columns.

### Changing GraphQL type

The `typeAlias` method allows you to specify a custom type for a column in the GraphQL schema. By default, Contember will map the column types in your entity schema to the appropriate GraphQL types based on the data type.

However, you can use the typeAlias method to specify a custom GraphQL type for a column. This can be useful if you need to customize the mapping between the column types in your schema and the GraphQL types.

#### Example how to use the typeAlias method to specify a custom GraphQL type for a column:

```typescript
publishedAt = def.dateTimeColumn().typeAlias('CustomDateTime')
```

In this example, the publishedAt property is a date-time column that is mapped to the `CustomDateTime` GraphQL type in the schema. This means that the `publishedAt` column will be of type `CustomDateTime` in the GraphQL schema, rather than the default `DateTime` type.

### Sequences

The `sequence` method allows you to enable a generated sequence on an integer column that is backed by a PostgreSQL identity column. This can be useful for generating unique, incrementing values for a column in your entity.

### Example how to enable a sequence:
```typescript
export class Task {
	counter = def.intColumn().sequence().notNull()
}
```
:::caution
Sequence column cannot be nullable.
:::

You can also pass an optional configuration with start and precedence. The start property allows you to specify the starting value for the sequence, and the precedence property allows you to specify whether the generated value should always (value `ALWAYS`) be used, or only if no value has been specified for the column (value `BY DEFAULT`, this is implicit behaviour).

#### Example of how to enable a sequence with different start and precedence:
```typescript
export class Task {
	counter = def.intColumn().notNull().sequence({ start: 1000, precedence: 'ALWAYS' })
}
```

In this example, the counter column in the Task entity is defined as an integer column with a generated sequence. The sequence will start at value 1000, and the generated value will always be used, regardless of whether a value has been specified for the column.


## Enums

Enums in Contember allow you to define a set of predefined values for a column in your entity schema. Enums can be used to limit the possible values that can be stored in a column, and can be useful for defining values that are used consistently throughout your application. The enum defined in a schema is mapped to a GraphQL enum. 

To define an enum, you can use the `createEnum` method. This method takes a list of string values, which will become the possible values of the enum.

### Example how to define an enum for a status column in a Task entity:
```typescript
export const TaskStatus = def.createEnum('pending', 'in_progress', 'completed')

export class Task {
  status = def.enumColumn(TaskStatus)
}
```

Single enum defined using the `createEnum` method can be used in multiple columns or entities. Y

You can also use methods like `setNull` or `unique`.
