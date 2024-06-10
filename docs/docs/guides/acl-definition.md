---
title: Roles and ACL definition
description: How to write custom roles definition.
---

Let's say we are defining two roles: a public role, which can see all visible comments, and a moderator role, who can edit and hide comments of given article in assigned category.

A simplified model definition for this example will look like this:

```typescript
export class Category {
	// ....
}

export class Article {
	category = def.manyHasOne(Category)
	// ....
}

export class Comment {
	article = def.manyHasOne(Article)
	content = def.stringColumn()
	hiddenAt = def.dateTimeColumn()
}
```

> We are using high level ACL definition API. For some cases, you might prefer a [low level definition API](/reference/engine/schema/acl.md#low-level-definition)

### Public role definition

First, we create a public role using [createRole](/reference/engine/schema/acl.md#create-role) function.

There is only single mandatory argument - a role identifier. In second argument, we can define various role options, as described [here](/reference/engine/schema/acl.md#create-role). 

```typescript
import { AclDefinition as acl } from '@contember/schema-definition'

export const publicRole = acl.createRole('public') 
```

Second, we assign an access rule to a `Comment` entity using [allow](/reference/engine/schema/acl.md#allow) function.

In a first argument of the function we pass previously defined role. Second argument is an object with the access definition itself.
In `when` we define a predicate. In `read` there is an array of accessible fields. You can also use `true` instead of an array to make all fields accessible:

```typescript
// highlight-start
@acl.allow(publicRole, {
	read: ['content'],
	when: { hiddenAt: { isNull: true } },
})
// highlight-end
export class Comment {
	// ...
}
```

That's all. Now, if you access the API with `public` role, you can see not hidden `Comment` rows, and you can access its `content` field.

### Moderator role definition

Now, we define a second mentioned role - a `moderator`. Again, we define a role:

```typescript
export const moderatorRole = acl.createRole('moderator')
```

Now it gets a bit more tricky, as we want to allow to only moderate comments in given category.

Let's define an [entity variable](#entity-variable), where a category ID (or a list of categories) will be stored for given user.

```typescript
export const categoryIdVariable = acl.createEntityVariable('categoryId', 'Category', moderatorRole)
```

You can manage this variable [on memberships using Tenant API](/reference/engine/tenant/memberships.md) using its name - `categoryId`.

Now we attach another ACL definition to our `Comment` entity:

```typescript
// highlight-start
@acl.allow(moderatorRole, {
	update: ['hiddenAt', 'content'],
	when: { article: { category: { id: categoryIdVariable } } },
})
// highlight-end
// other ACL definitions
export class Comment {
	// ...
}
```

As you can see, you can traverse through relations. Our definition says, that `moderator` can update fields `hiddenAt` and `content` of any `Comment` of an `Article` in a `Category` defined in `categoryId` variable. 

:::note migrations
Don't forget to [create a migration](/reference/engine/migrations/basics.md) to apply changes:
```bash
npm run contember migrations:diff my-blog setup-acl
```
:::

#### Full example:
```typescript
import { SchemaDefinition as def, Acldefinition as acl } from '@contember/schema-definition'

export const publicRole = acl.createRole('public')

export const moderatorRole = acl.createRole('moderator')
export const categoryIdVariable = acl.createEntityVariable('categoryId', 'Category', moderatorRole)

export class Category {
	// ....
}

export class Article {
	category = def.manyHasOne(Category)
	// ....
}

@acl.allow(moderatorRole, {
	when: { article: { category: { id: categoryIdVariable } } },
	update: ['hiddenAt', 'content'],
})
@acl.allow(publicRole, {
	when: { hiddenAt: { isNull: true } },
	read: ['content'],
})
export class Comment {
	article = def.manyHasOne(Article)
	content = def.stringColumn()
	hiddenAt = def.dateTimeColumn()
}

```
