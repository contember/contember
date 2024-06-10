---
title: Permissions and ACL
---

Contember provides an easy way to create user roles with granular permission.

Using our declarative ACL, you can define not only row and column level permissions, but also cell level. In other words, you can define different conditions for accessing individual fields of a single row. 

In ACL definition, you use same filters you know from [Content API filters](/reference/engine/content/queries.md), so you can traverse through relations and build complex cross-entity rules.

## Terminology

### Variable

Variable is defined for certain _role_ and its value injected to _predicate_ when a predicate is evaluated.

#### Entity variable

Entity variables are stored in Tenant API within a [membership](/reference/engine/tenant/memberships.md). Usually some kind of dimension by which you split your data - e.g. a site or a language, or even a category.

#### Predefined variables

There are two predefined variables - `identityID` with an ID of identity associated with current request and `personID` with ID of person. `personID` will be empty if the request is executed with token which is not associated with a person.

#### Condition variables

Allows injecting arbitrary [column condition](/reference/engine/content/queries.md#comparison-operators) into a predicate. This enables the creation of more complex predicates, such as those for date ranges.

:::note
Variable values representing the condition must be passed as a serialized JSON string, for both the Tenant API for membership management and for the assume membership feature.
:::

### Predicates

Predicates are defined on entity level of given role. It is basically a condition, which is evaluated, when you try to access a field.

### Operations

There are following kinds of operations - `read`, `update`, `create` and `delete`. For each you can set up the rules.

:::note
Note that for a "delete" operation you can't set rules on each field, because you are deleting a row as a whole.
:::

## ACL definition

ACL definition API provides an easy way to define ACL rules directly within model definition by attaching a decorators to entities. For some cases, you might prefer a [low level definition API](#low-level-definition).

-----

### `createRole`: Defining a role {#create-role}
A function for defining an ACL role.
```typescript
createRole(roleName, options)
```

#### Function arguments:
- `roleName`: a role identifier. You use this name in [Tenant API](/reference/engine/tenant/memberships.md)
- `options`: optional argument, where you can define [tenant](#tenant-permissions) and [system](#system-api-permissions) permissions. 

Each role must be exported from schema definition using `export const ...`

#### Example: creating editorRole
```typescript
import { AclDefinition as acl } from '@contember/schema-definition'
export const editorRole = acl.createRole('editor')
```

#### Example: creating editorRole with additional options
```typescript
import { AclDefinition as acl } from '@contember/schema-definition'
export const editorRole = acl.createRole('editor', {
	tenant: {
		invite: true,
		// ...
	},
	system: {
		history: true,
		// ...
	}
})
```

-----

### `createEntityVariable`: Defining an entity variable {#create-entity-variable}

```typescript
createEntityVariable(variableName, entityName, role[, fallback])
```

#### Function arguments:
- `variableName`: a variable identifier. It must be unique for given role. You use this name in [Tenant API](/reference/engine/tenant/memberships.md)
- `entityName`: an entity name, for which we define this variable
- `role`: a role reference (created using [createRole](#createrole)), for which this variable is defined. You can also pass an array of roles.
- `fallback`: optional fallback condition, when a variable is not passed


#### Example: defining categoryId entity variable
```typescript
import { AclDefinition as acl } from '@contember/schema-definition'

export const categoryIdVariable = acl.createEntityVariable('categoryId', 'Category', editorRole)
```

### `createPredefinedVariable`: Defining a predefined variable {#create-predefined-variable}

```typescript
createConditionVariable(variableName, value, role[, fallback])
```

#### Function arguments:

- `variableName`: a variable identifier. It must be unique for given role. You use this name in [Tenant API](/reference/engine/tenant/memberships.md)
- `value`: a value type passed to a variable, can be either `identityID` or `personID`  
- `role`: a role reference (created using [createRole](#createrole)), for which this variable is defined. You can also pass an array of roles.
- `fallback`: optional fallback condition, when a variable is not passed

#### Example: defining personVariable predefined variable

```typescript
import { AclDefinition as acl } from '@contember/schema-definition'

export const personVariable = acl.createPredefinedVariable('person', 'personID', readerRole)
```

### `createConditionVariable`: Defining a condition variable {#create-condition-variable}

```typescript
createConditionVariable(variableName, role[, fallback])
```

#### Function arguments:

- `variableName`: a variable identifier. It must be unique for given role. You use this name in [Tenant API](/reference/engine/tenant/memberships.md)
- `role`: a role reference (created using [createRole](#createrole)), for which this variable is defined. You can also pass an array of roles.
- `fallback`: optional fallback condition, when a variable is not passed


#### Example: defining subscriptionVariable condition variable

```typescript
import { AclDefinition as acl } from '@contember/schema-definition'

export const subscriptionVariable = acl.createConditionVariable('subscription', readerRole)
```

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
