---
title: Relationships
---

Contember knows and correctly handles all kinds of relationships - one has one, one has many and many has many.


## Quick example
Let's define two entities - a *Category* and a *Post*:

```typescript
export class Category {
	name = def.stringColumn();
}
export class Post {
	title = def.stringColumn();
	content = def.stringColumn();
}
```

Now just add a relationship field to the *Post* entity definition:

```typescript
export class Post {
	title = def.stringColumn().notNull();
	content = def.stringColumn();
	// highlight-next-line
	category = def.manyHasOne(Category);
}
```

That's all. In next sections, you'll find out how to setup inverse side, not null etc. 

## Types of relationships

We distinguish relationship types - simply "how many entities can be referenced."

### One-has-many (and many-has-one)

Owning side of this relationship references (at most) one entity, but that entity can be referenced many times.

![one has many relationship](/assets/one-has-many.svg)

- We define owning side of this relationship using `manyHasOne` method. 
- Optionally, we define an inverse side using `oneHasMany` method. 
- Joining column with actual relationship value is located on owning side.
- For this relationship, you can also configure:
  - [nullability](#nullability) on owning side
  - [delete behaviour](#on-delete-behavior) on owning side
  - [default order](#default-order) on inverse side.

#### Use case

This is probably the most common type of relationship. 

An example is a *Post* having a many *PostComment*, but the *PostComment* belongs to one single *Post*. 
Here, the *PostComment* is owning side of this relationship, because it holds a *Post* identifier in its joining column.

#### Example: Configuring only owning side

```typescript
export class PostComment {
	// highlight-next-line
	post = def.manyHasOne(Post)
}
export class Post {
} 
```

#### Example: Configuring both owning and inverse side

```typescript
export class PostComment {
	// highlight-next-line
	post = def.manyHasOne(Post, 'comments')
}

export class Post {
	// highlight-next-line
	comments = def.oneHasMany(PostComment, 'post')
}
```

### Many-has-many

An owning entity can reference many inverse entities. Also, this inverse entity can be referenced from many owning entities. 

![many has many relationship](/assets/many-has-many.svg)

- Relationship is realized through a joining (also called junction) table. 
- Although there is no joining column, we still recognize owning and inverse side (mainly for configuration purposes). 
- We define owning side of this relationship using `manyHasMany` method. 
- Optionally, we define an inverse side using `manyHasManyInverse` method.
- For this relationship, you can also configure:
  - [default order](#default-order) on both sides
  
#### Use case

Useful when you need to just connect two entities without any additional metadata.
E.g. a *Post* has many *Tag*s, also there are many *Post*s of each *Tag*. 
Downside is that you cannot attach any information on the relationship between them, e.g. you can't even sort *Tag*s of given *Post*. 
In case you need such thing, you'd better create an extra entity representing the relationship (e.g. a *PostTag* referencing using ManyHasOne both *Post* and *Tag*)

#### Example: Configuring only owning side

```typescript
export class Post {
	// highlight-next-line
	tags = def.manyHasMany(Tag)
}
export class Tag {
} 
```

#### Example: Configuring both owning and inverse side

```typescript
export class Post {
	// highlight-next-line
	tags = def.manyHasMany(Tag, 'posts')
}

export class Category {
	// highlight-next-line
	posts = def.manyHasManyInverse(Post, 'tags')
}
```

#### Example: Alternative design with intermediate entity representing the relationship

```typescript
export class Post {
	tags = def.oneHasMany(PostTag, 'post')
}

export class PostTag {
	// highlight-next-line
    post = def.manyHasOne(Post, 'tags').notNull().cascadeOnDelete()
	// highlight-next-line
    tag = def.manyHasOne(Tag, 'posts').notNull().cascadeOnDelete()
	// highlight-next-line
    order = def.intColumn()
}

export class Tag {
	posts = def.oneHasMany(PostTag, 'tag')
}
```

### One-has-one

There is at most one entity on each side of this relationship.

![one has one relationship](/assets/one-has-one.svg)

- We define owning side of this relationship using `oneHasOne` method. 
- Optionally, we define an inverse side using `oneHasOneInverse` method. 
- Joining column with actual relationship value is located on owning side.
- For this relationship, you can also configure 
  - [nullability](#nullability) on both sides
  - [delete behaviour](#on-delete-behavior) on owning side 
  - [orphan removal](#orphan-removal) on owning side

#### Use case

Not as common, but sometimes useful type of relationship. 
Imagine entities *Post* and *PostContent* - there is always single *PostContent* entity of each *Post* and a single *Post* for each *PostContent*. 
In this case, it might seem a bit pointless - all fields *PostContent* entity can be safely inlined into *Post*. 
Let's change it a bit - rename *PostContent* to *Content*. 
Now we can reference this generic *Content* not only from a *Post*, but also from e.g. a *Category* and use same logic for storing, managing and rendering the *Content* of both entities. 
In this example, owning side would be in *Post* and *Category* entities, optional inverse side in *Content*.

#### Example: Configuring only owning side

```typescript
export class Post {
	// highlight-next-line
	content = def.oneHasOne(Content)
}
export class Content {
}
```

#### Example: Configuring both owning and inverse side

```typescript
export class Post {
	// highlight-next-line
	content = def.oneHasOne(Content, 'post')
}

export class Content {
	// highlight-next-line
	post = def.oneHasOneInverse(Post, 'content')
}
```

## Relationships settings

### Nullability

You can also define `.notNull()` constraint for "one has one" relationships and owning side of "many has one" relationship.
This will ensure that there is an entity connected. 
#### Example: making category of post not nullable
```typescript
export class Post {
	// highlight-next-line
	category = def.manyHasOne(Category).notNull();
}
```

### On delete behavior

Using `.onDelete()` you can set what happens when referenced entity is deleted. 
E.g. you have a post, which is assigned to a category. When a category is deleted, three things can happen:

- Restrict: this is default behavior. When you try to delete an entity, which is referenced from other entities, the delete operation will fail.
- Set null: field, which references removed entity, is set to null. Obviously, this is possible only for nullable relationships. You can use shortcut `.setNullOnDelete()` to select this behavior.
- Cascade: all entities, which references an entity which is being removed, are also removed. You can use a shortcut `.cascadeOnDelete()`.

Pay attention when you are choosing the strategy, because choosing a wrong strategy may lead to runtime errors or deleting more content than you wanted.

:::note 
In database, all relationships are marked as "NO ACTION" and actual strategy is executed by Contember. 
This is because Contember can evaluate ACL rules.
:::

#### Example: setting onDelete cascade

This will delete Post entity when referenced Content is deleted.

```typescript
export class Post {
	// highlight-next-line
	content = def.oneHasOne(Content, 'post').cascadeOnDelete()
}
```

#### Example: setting onDelete cascade

This will set content relationship to `null` when referenced Content is deleted

```typescript
export class Post {
	// highlight-next-line
	content = def.oneHasOne(Content, 'post').setNullOnDelete()
}
```

### Default order

You can use a method `.orderBy()` on "has many" relationships to set default order of this relationship. 
Of course, you can later override this order in a query.


#### Example: sorting posts in a category by title
```typescript
export class Category {
	title = def.stringColumn();
	// highlight-next-line
	posts = def.oneHasMany(Post, "category").orderBy("title");
}

export class Post {
	title = def.stringColumn().notNull();
	category = def.manyHasOne(Category, "posts");
}
```

:::note
By calling this method multiple times, you can set subsequent order rules.
```typescript
export class Category {
	title = def.stringColumn();
	// highlight-next-line
	posts = def.oneHasMany(Post, "category").orderBy("title").orderBy('lead');
}
```
:::


### Orphan removal

Orphan removal is a special behaviour for one-has-one relationships. When you delete an owning side of relationship (e.g. a *Post* of *Content*), the inverse side (*Content*) remains orphaned, meaning it is not referenced from any *Post*.

By enabling this option, *Content* will be removed once *Post* is removed.

#### Example: enabling orphan removal

```typescript
export class Post {
	// highlight-next-line
	content = def.oneHasOne(Content, 'post').removeOrphan()
}
```
