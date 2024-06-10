---
title: Query language
---

Contember Query Language is a custom query language used in Contember Interface to specify entities, fields, and filters used in most data binding related components and hooks. The language is context-dependent, meaning that its usage and interpretation depend on the context in which it is used. For example, in the context of an `EditPage`,  you define a single entity to be edited, while in the context of a `options` of `SelectField` you are defining list of fields visible in a select.
## Filters

Filters allow you to specify conditions for selecting or excluding certain entities or fields in your query.

To use a filter, you need to enclose it in square brackets after an entity, you want to filter, and specify the field, operator, and value.

#### Example:
```
Author[age > 18]
```

This filter selects all entities with an age greater than 18.

You can use dot notation to specify nested fields in the field part of the filter.

#### Example of nesting over relations:
```
Author[author.age > 18]
```
This filter selects all entities with an author who is older than 18.


### Value types

The value part of the filter can be `null`, `true`, `false`, a number, a string in single quotes, an enum literal (without quotes), or a variable (starting with a dollar).

#### Example of is not null
```
Article[status != null]
```

#### Example of boolean

```
Article[published = true]
```

#### Example of number

```
Article[views > 1000]
```

#### Example of enum:
```
Article[status = published]
```

#### Example of a string:

```
Article[title = 'Hello world']
```

#### Example of a variable:

```
Article[title = $title]
```

### Logical operators

You can also use logical `&&` and `||` to combine multiple filters. Also, you can use `!` for negation.

#### Example of boolean and
```
Author[age > 18 && public = true]
```

### Prioritization

You can use round brackets to prioritize the evaluation of filters.

##### Example of prioritization
```
Article[(views > 100 && status = 'published') || (views < 100 && status = 'draft')]
```

### Operators

The following operators are available in filters:

- `=` Equals to
- `!=` Not equals to
- `>` Greater than
- `<` Less than
- `>=` Greater than or equals
- `<=` Less than or equals

## Unique where

The unique where clause is used to specify a filter that identifies a single entity. It is placed in round brackets, and only supports the "equals" operator. You can use multiple conditions separated by a comma to filter by compound unique.

#### Example of unique where
```
Article(id = $id)
```
This filter will retrieve a single article based on its unique identifier, specified by the $id variable.

#### Example of compound unique
```
ArticleTranslation(article.id = $id, locale = 'en')
```
This filter will retrieve a single article translation based on the unique combination of its article's identifier and its locale.


## Query language contexts

### Qualified single entity
To identify a single entity by its unique identifier, the qualified single entity form of the query language is used. It is commonly used in entity-aware pages such as `EditPage` or `DetailPage`.

To reference the entity, you specify the entity name followed by unique where in round brackets.

#### Example how to specify a single library book with an ID of 123:
```
Book(id = 123)
```

### Example of compound unique
```
BookTranslation(book.id = 123, locale = 'en')
```

#### Example of usage in EditPage:
```typescript jsx
<EditPage entity="Book(id = $id)">
{/* form fields and other components go here */}
</EditPage>
```

### Unconstrained Qualified Single Entity
This type of query is used to define an entity without any specific constraints. It is usually just the name of the entity, and it is used in the `CreatePage` component.

#### Example
```typescript jsx
<CreatePage entity="Book">
{/* form fields and other components go here */}
</CreatePage>
```

### Qualified Entity List
This is used to identify a list of entities that meet certain criteria. They are commonly used in components such as `DataGridPage`, `ListPage`, or the `options` prop of `SelectField`.

To create a qualified entity list, you simply specify the name of the entity optionally followed by any desired filters in square brackets.

#### Example how to return a list of all authors who are over the age of 18:
```
Author[age >= 18]
```

#### Example of nesting over relations to reference nested entities in your filters:
```
Article[status = 'published' && author.age >= 18]
```

#### Example of usage in `DataGridPage`
```typescript jsx
<DataGridPage entities="Author[age >= 18]">
</DataGridPage>
```


### Qualified Field List

Qualified Field List is a way of identifying a field of an entity, returning a list of entities with given field. It can also be filtered to return a specific subset. It is commonly used e.g. in `options` of `SelectField` component.

#### Example
```
Author[age < 123].name
```
This query references the name field of the Author entity, where the age field is less than 123.

#### Example of usage in SelectField
```typescript jsx
<SelectField options="Author[age < 123].name" />
```

### Relative single field
Relative single field refers to a field within the current entity context. It is often used in components such as `Field`, `TextField`, or the `useField` hook.

To reference a field, you can simply provide the field name. For example, to reference the `age` field of the current entity:

```typescript jsx
<Field field="age"/>
```

You can also reference nested fields by separating the field names with a dot.

#### Example how to reference the name field of the author relation of the current entity:
```
author.name
```
You can also use filters to narrow down the list of entities.

#### Example how to reference the name field of the author relation of the current entity, but only where the age of the author is less than 18:

```
author[age < 18].name
```

### Relative Single Entity
Relative single entity is used to reference an entity in the current entity context. It is commonly used in `SelectField` or `HasOne` components.

To specify a relative single entity, you can simply use the name of the relation in the current context. For example, to reference the `author` entity in the current context:
```
author
```

#### Example of using a relative single entity in a SelectField component:
```
<SelectField field='author' />
```

#### Example how to use a unique filter to reference a single entity, like so:
```
translationByLocale(locale = en)
```

This can be useful in cases where you want to reference a specific entity based on a unique field value.

You can also apply filters here:
```
author[age < 18]
```


### Relative Entity List

This refers to a list of entities that are related to the current entity context. It is used in components such as `Repeater` or `HasMany` to reference a list of entities from the current entity context.

#### Example of usage in a `HasMany` component:

```typescript jsx
<HasMany field='comments'>
  {/* ... */}
</HasMany>
```

You can also use filters to narrow down the list of entities.

#### Filters example
```typescript jsx
<HasMany field='comments[status = "published"]'>
  {/* ... */}
</HasMany>
```

In this example, only published comment entities will be included in the list.
