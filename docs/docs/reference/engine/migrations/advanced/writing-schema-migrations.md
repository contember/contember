---
title: Writing or fixing migrations manually
---

Typically, you won't need to write migrations from scratch, but there may be occasions when you need to fine-tune or rectify a generated migration. When you open a generated `.json` migration file, you'll find a list of "modifications" that describe the changes made to your database schema. In such cases, you can manually adjust these modifications to tailor your migrations to specific requirements. Below are the available manual adjustments you can make to migrations.

### `fillValue` and `copyValue` support

In Contember, migrations can be manually adjusted or fixed when needed. When working with migrations, you may encounter two modifications, `createColumn` and `updateColumnDefinition`, which now support the `fillValue` and `copyValue` features. These options allow you to provide values during the migration process for added columns or modified columns that have been changed to disallow null values.

#### `createColumn` modification and `copyValue`/`fillValue`

The `createColumn` modification enables the addition of a new column to an entity. When creating a column that does not allow null values, you can utilize the following options:

- **fillValue**: Specifies a value that will be used to fill the column during the migration run. This value is distinct from the default value used at runtime. If a new column with a default value is added, the default value will also be used as the fillValue in the generated JSON migration.

- **copyValue**: Indicates the name of another column from which the value will be copied to the newly created column.

**Example:**

```json5
{
	"modification": "createColumn",
	"entityName": "Article",
	"field": {
		"name": "isPublished",
		"columnName": "is_published",
		"columnType": "boolean",
		"nullable": false,
		"type": "Bool"
	},
	/* highlight-start */
	"fillValue": false
	/* highlight-end */
}
```

#### <span className="version">Engine 1.3+</span> `updateColumnDefinition` modification and `copyValue`/`fillValue`

The `updateColumnDefinition` modification allows you to modify the definition of an existing column within an entity. When changing a column to disallow null values, you can make use of the following options:

- **fillValue**: Specifies a value that will be used to fill the column during the migration run. This option proves useful in populating the modified column with meaningful data when the nullability constraint is enforced.

- **copyValue**: Indicates the name of another column from which the value will be copied to the modified column.

**Example:**

```json5
{
	"modification": "updateColumnDefinition",
	"entityName": "Article",
	"fieldName": "isPublished",
	"definition": {
		"columnType": "boolean",
		"nullable": false,
		"type": "Bool"
	},
	/* highlight-start */
	"copyValue": "existingColumn"
	/* highlight-end */
}
```

In this example, the value from an existing column named "existingColumn" will be copied to the modified column "isPublished" during the migration run.

### Renaming Entities

In Contember, renaming an entity involves creating a migration that drops the old entity and creates a new one. However, with the `updateEntityName` modification, you can instruct Contember to simply rename an existing entity without recreating it.

**Arguments:**

- **entityName**: The current name of the entity.
- **newEntityName**: The desired new name for the entity.
- **tableName**: You can optionally also change the name of the database table.

**Example:**

```json
{
	"modification": "updateEntityName",
	"entityName": "OldEntity",
	"newEntityName": "NewEntity",
	"tableName": "new_entity"
}
```

In this example, the entity named "OldEntity" will be renamed to "NewEntity" using the `updateEntityName` modification. Also, the table in database will be renamed to `new_entity`

### Renaming Fields

Similar to the `updateEntityName` modification, the `updateFieldName` modification allows you to rename a field within an entity.

**Arguments:**

- **entityName**: The name of the entity containing the field.
- **fieldName**: The current name of the field.
- **newFieldName**: The desired new name for the field.
- **columnName**: You can optionally change the name of the field in a database.

**Example:**

```json5
{
	"modification": "updateFieldName",
	"entityName": "Entity",
	"fieldName": "oldField",
	"newFieldName": "newField",
	"columnName": "new_field"
}
```

In this example, the field named "OldField" within the entity "Entity" will be renamed to "NewField" using the `updateFieldName` modification.
