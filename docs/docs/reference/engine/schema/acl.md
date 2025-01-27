---
title: Permissions and ACL
---

## Permissions and ACL

Contember provides a straightforward way to create user roles with granular permissions. Using our declarative ACL, you can define:

- **Row-level permissions**: which rows (records) a role may see or modify
- **Column-level permissions**: which fields (columns) of a record are visible or writable
- **Cell-level permissions**: different conditions on individual fields within the same row

Under the hood, Contember translates your rules into *predicates* and merges them when multiple rules apply.

### Underlying Concepts

#### Filters and Predicates

Contember uses the same filters for ACL conditions as those in the [Content API filters](/reference/engine/content/queries.md). You can thus traverse relations, join multiple conditions with logical operators (e.g., `AND`, `OR`), and define even very complex ACL rules.

A **predicate** is basically a condition describing under what circumstances a role can access or modify data. Predicates can reference:

- **Columns** directly (e.g., `hiddenAt.isNull = true`)
- **Variables** (which represent dynamic values provided at runtime)
- **Other predicates** (e.g., referencing a relation’s “read” predicate)

#### Variables

A variable is defined for a certain *role* and is injected into a predicate at evaluation time. They let you parameterize your ACL rules.

1. **Entity variable**

- Points to an entity (e.g., `Category`)
- Useful for scenarios where each user has access to a particular “dimension” (e.g., site, language, category ID, etc.)

2. **Predefined variables**

- Built-in variables `identityID` and `personID`
- You can define your own references to these IDs using `createPredefinedVariable`

3. **Condition variables**

- Represent more complex [column conditions](/reference/engine/content/queries.md#comparison-operators) that can be injected at runtime (e.g., a date range).

All variable values are managed via the [Tenant API Memberships](/reference/engine/tenant/memberships.md) or the “Assume Membership” feature.

:::note
After changing ACL definitions, remember to create and apply a migration.
:::

---

## Defining Roles and Variables

### `createRole(roleName, options?)`

Creates a named role in your schema. You use the `roleName` in the [Tenant API for memberships](/reference/engine/tenant/memberships.md).

- **Arguments**

  - `roleName`: string identifier for the role
  - `options?`: optional settings for that role. You can configure e.g.:
    - `tenant`: permissions in the Tenant API (like `invite`, `manage`, etc.)
    - `system`: permissions in the System API (like `history`)
    - `stages`: by default `'*'`, meaning all stages
    - `debug`: allows debugging GraphQL queries 
    - `s3`, see [S3 ACL](/reference/engine/content/s3)

- **Example**:

  ```ts
  import { c } from '@contember/schema-definition'
  export const editorRole = c.createRole('editor', {
    tenant: {
      invite: true,
    },
    system: {
      history: true,
    },
  })
  ```

### `createEntityVariable(variableName, entityName, roleOrRoles[, fallback])`

Defines an **entity variable** that will hold an ID or a list of IDs referencing a particular entity. Useful when you want to scope a role to specific rows (e.g., “editor can only manage rows in Category #123”).

- **Arguments**

  - `variableName`: unique identifier for the variable (within the same role)
  - `entityName`: the entity name (e.g., `"Category"`)
  - `roleOrRoles`: either a single role or an array of roles
  - `fallback?`: optional fallback condition (e.g., `"never"` or a condition like `{ id: { eq: SOME_ID } }`) if no variable is supplied

- **Example**:

  ```ts
  import { c } from '@contember/schema-definition'
  import { moderatorRole } from './roles'

  export const categoryIdVariable = c.createEntityVariable(
    'categoryId', 
    'Category', 
    moderatorRole
  )
  ```

### `createPredefinedVariable(variableName, value, roleOrRoles[, fallback])`

Defines a variable referencing a **built-in** value (`identityID` or `personID`).

- **Arguments**

  - `variableName`: unique identifier for the variable (within the same role)
  - `value`: must be `"identityID"` or `"personID"`
  - `roleOrRoles`: the target role(s)
  - `fallback?`: optional fallback if no predefined variable is available

- **Example**:

  ```ts
  import { c } from '@contember/schema-definition'
  import { readerRole } from './roles'

  // Creates a variable called 'person',
  // which will be replaced by the personID during runtime:
  export const personVariable = c.createPredefinedVariable(
    'person',
    'personID',
    readerRole,
  )
  ```

### `createConditionVariable(variableName, roleOrRoles[, fallback])`

Defines a **condition variable** that can store an arbitrary complex condition (e.g., date range or numeric bounds). The condition must be passed as a serialized JSON via Tenant API membership or using [assume membership](/reference/engine/content/advanced/assume-membership).

- **Arguments**

  - `variableName`: the variable name
  - `roleOrRoles`: the target role(s)
  - `fallback?`: optional fallback condition

- **Example**:

  ```ts
  import { c } from '@contember/schema-definition'
  import { readerRole } from './roles'

  export const subscriptionVariable = c.createConditionVariable(
    'subscription', 
    readerRole
  )
  ```

## Applying ACL Rules with the `@c.Allow` Decorator

Most of the time, you will declare ACL rules directly in your schema using the `@c.Allow` decorator on your entities. This high-level API covers typical scenarios such as:

- Granting **read**, **create**, **update**, **delete** operations
- Providing **conditions** (`when`)
- Restricting access to certain **fields** (columns)
- Allowing/disallowing **root-level** operations with `through`

### Usage

```ts
@c.Allow(
  roleOrRoles, 
  {
    when?: Filter,       // Condition for this rule
    read?: boolean | string[], 
    update?: boolean | string[],
    create?: boolean | string[],
    delete?: boolean,
    through?: boolean,   // Disallow direct (root-level) operation if set to true
  }
)
```

- **`roleOrRoles`**: A single role (e.g., `editorRole`) or an array of roles.
- **`when`** (optional): A predicate (filter condition) that must be true for this rule to apply.
  - If you define multiple `@c.Allow` decorators with different `when`, they are combined with logical `OR`.
- **`read`, `update`, `create`**: Specifies which fields are allowed for the given operation.
  - `true` means “all fields.”
  - A string[] means “these specific fields.”
  - If omitted or `false`, the operation is disallowed by this rule (but can still be granted by another rule).
- **`delete`**: A boolean. If `true`, allows deleting the entire row under the given `when` condition; if omitted or `false`, it does not allow deletion.
- **`through`**:
  - If `true`, means that *root-level* access for the operation is **disallowed**, but the operation is still allowed **through relations**.
  - If you set `through: true`, you are effectively restricting direct queries (like listBook) or direct mutations (e..g updateBook) on the root. However, you can still access this entity if you traverse from a parent entity that *does* allow a root-level operation.
  - You cannot mix "through" for the same operation in a conflicting way

#### Multiple `@c.Allow` Decorators

When you use multiple `@c.Allow` decorators on the same entity for the same role:

- The fields or operations they allow are combined in an **OR** manner.
- Predicates (`when`) are likewise combined with `OR`.

This means that if any of your rules says “OK” for a particular field or operation, it is allowed.

### Examples

#### 1. Simple Read-Only Access

```ts
import { c } from '@contember/schema-definition'

export const publicRole = c.createRole('public')

@c.Allow(publicRole, {
  read: ['title'],
})
export class Book {
  title = c.stringColumn()
}
```

- `public` can read only the `title` column.
- Attempting to read other columns on `Book` is disallowed unless another rule grants it.

#### 2. Conditional Visibility

```ts
@c.Allow(publicRole, {
  when: { isPublished: { eq: true } },
  read: true,
})
export class Book {
  title = c.stringColumn()
  isPublished = c.boolColumn()
}
```

- Allows reading **all** columns, but only if `isPublished = true` for that row.

#### 3. Multiple Conditions (OR)

```ts
@c.Allow(publicRole, {
  when: { isReleased: { eq: true } },
  read: ['title'],
})
@c.Allow(publicRole, {
  when: { isArchived: { eq: true } },
  read: ['title'],
})
export class Book {
  title = c.stringColumn()
  isReleased = c.boolColumn()
  isArchived = c.boolColumn()
}
```

- `public` may read `title` if `isReleased = true` **OR** `isArchived = true`.

#### 4. Update Access with a Relation Condition

```ts
import { c } from '@contember/schema-definition'
import { moderatorRole, categoryIdVariable } from './roles'

@c.Allow(moderatorRole, {
  when: { article: { category: { id: categoryIdVariable } } },
  update: ['hiddenAt', 'content'],
})
export class Comment {
  article = c.manyHasOne(Article)
  content = c.stringColumn()
  hiddenAt = c.dateTimeColumn()
}
```

- A user in the `moderator` role can update the `hiddenAt` and `content` fields of any comment belonging to an article in a category whose ID matches the `categoryId` variable.

#### 5. Restricting Root-Level Access with `through`

```ts
@c.Allow(publicRole, {
  read: ['id'],
})
@c.Allow(publicRole, {
  when: { category: { isActive: { eq: true } } },
  through: true,
  update: ['name'],
})
@c.Allow(publicRole, {
  when: { category: { isActive: { eq: false } } },
  through: true,
  update: ['name'],
})
export class Product {
  name = c.stringColumn()
  category = c.manyHasOne(Category)
}
```

- `read` of `id` is allowed at root level.
- `update` of `name` is **not** allowed at the root query/mutation because `through: true` prevents direct updates.
- If an upstream entity relation to `Product` is allowed to update it, then the user can update `name` **through** that relation—provided the `category` is `isActive: true` or `isActive: false`.


## `@c.AllowCustomPrimary`

The `@c.AllowCustomPrimary` decorator allows client-generated IDs to be used as primary keys when creating or updating entities. This is particularly useful for use cases like synchronizing data between external systems or generating unique identifiers outside of Contember.

- Unlike `@c.Allow`, this decorator must be applied directly to the entity class without specifying roles or conditions.

### Example

```ts
import { c } from '@contember/schema-definition'

@c.AllowCustomPrimary()
export class Order {
  id = c.uuidColumn().notNull()
  amount = c.intColumn()
  customer = c.manyHasOne(Customer)
}
```

- This example enables the client to specify the `id` of an `Order` when creating or updating it.
- No additional ACL rules are required to allow this behavior.


## Summary

- **Roles** define top-level scopes of permissions.
- **Variables** parametrize predicates so each user within a role can have different row scoping or dynamic conditions.
- **@c.Allow** is the primary method to specify which operations a role can perform on which columns/fields, optionally restricted by predicates (`when`) or limiting root-level vs. relation-level access (`through`).
- **@c.AllowCustomPrimary** enables client-generated IDs for primary keys, useful for specific workflows.
- **Predicates** combine multiple conditions using `AND` or `OR` behind the scenes, giving flexible, fine-grained control.

This reference should help you set up ACLs that fit most scenarios. For more specialized needs (or advanced usage like partial row visibility, advanced condition variables, or low-level ACL definition), see the [low-level ACL definition](/reference/engine/schema/acl.md#low-level-definition) or reach out to the Contember community.

:::note
Each variable must be exported from schema definition using `export const ...`
:::

## Tenant permissions

See [tenant permissions](./tenant-acl.md)


### Assume identity

See [assume identity](/reference/engine/content/advanced/assume-identity)

### Assume membership

See [assume membership](/reference/engine/content/advanced/assume-membership)


<!--

## ACL evaluation

TODO

-->

## S3 ACL

See [S3 chapter](/reference/engine/content/s3)

## Low level ACL definition {#low-level-definition}

Instead of decorators, you can build ACL definition by yourself. Check [type definition](https://github.com/contember/engine/blob/2113107668d5d6e0c6cf2d68724695b953ec9efb/packages/schema/src/schema/acl.ts) for exact structure of ACL schema.

### Entity variable

Entity variables are stored in Tenant API within a [membership](/reference/engine/tenant/memberships.md). Usually some kind of dimension by which you split your data - e.g. a site or a language, or even a category.

```typescript
const variables = {
	language_id: {
		type: Acl.VariableType.entity,
		entityName: "Language",
	},
};
```

### Predefined variables

Currently, there are two predefined variables - `identityID` with an ID of identity associated with current request and `personID` with ID of person. `personID` will be empty if the request is executed with token which is not associated with a person.

```typescript
const variables = {
	identity_id: {
		type: Acl.VariableType.predefined,
		value: 'identityID',
	}
}
```

### Predicates

Before you set a rule to a field, you have to define a predicate on an entity - or you can use the most simple predicate `true`, which always allows given operation.

Predicates definition is similar to a syntax you use for [filtering a data](/reference/engine/content/queries.md#filters). Lets say you have entities _Language_ and _Post_. And of course a relationship between them. And you only want to allow editors to edit a post in their language. A predicate definition, which references the variable `language_id`, may look like this:

```typescript
const postEntityPredicates = {
	languagePredicate: {
		language: {
			id: "language_id",
		},
	},
};
```

### Rules

Now you have the predicate defined, so you can set rules on each field of the entity.

```typescript
const postEntityOperations = {
	read: {
		title: true,
	},
	update: {
		title: "languagePredicate",
	},
	create: {
		title: "languagePredicate",
	},
	delete: false,
};
```

This definition says that user can read a title of any post, can create or edit a post in his language and cannot delete any post.

You don't have to define a rule for `id` field, because it is automatically computed from other fields.

### Roles

Role contains set of rules for individual entities and their fields. Putting it all together, a role definition may look like this:

```typescript
const editorRole = {
	variables: variables,
	entities: {
		Post: {
			predicates: postEntityPredicates,
			operations: postEntityOperations,
		},
	},
};
```

### Merging with a model definition

You must manually merge low-level ACL definition in schema entrypoint - [api/index.ts](https://github.com/contember/engine/blob/2113107668d5d6e0c6cf2d68724695b953ec9efb/packages/cli-common/resources/templates/template-project/api/index.ts).

#### Example: merging low-level ACL definition
```typescript
import { createSchema } from '@contember/schema-definition'
import * as model from './model'
import acl from './acl'

export default { ...createSchema(model), acl }
```

> Note, that this will override any ACL definition produced by decorators API. To combine these approaches, you must merge it deeply.
