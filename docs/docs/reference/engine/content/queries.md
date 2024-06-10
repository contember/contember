---
title: GraphQL Queries
---


Contember provides a GraphQL API for fetching and modifying data. There are three types of queries available for each entity: "get" for fetching a single record by a unique field, "list" for simple listing, and "paginate" for pagination similar to the Relay specification. The "get" query requires a "by" parameter that allows filtering by a primary column or any other unique columns. The "list" query offers additional options such as filtering using complex conditions, ordering the result, and paging using a limit and offset. The "paginate" query works similarl to the "list" query but returns a connection object that includes pagination information such as the total count and edges for each record.

For following entity:

```typescript
import { SchemaDefinition as def } from "@contember/schema-definition";

export class Post {
  title = def.stringColumn().notNull();
  publishedAt = def.dateTimeColumn();
}
```

GraphQL schema will be similar to this (some types are omitted in the example for clarity):

```graphql
query {
  getPost(by: PostUniqueWhere!, filter: PostWhere): Post
  listPost(filter: PostWhere, orderBy: [PostOrderBy!], offset: Int, limit: Int): [Post!]
  paginatePost(filter: PostWhere, orderBy: [PostOrderBy!], skip: Int, first: Int): PostConnection!
}
input PostUniqueWhere {
  id: UUID
}
input PostOrderBy {
  id: OrderDirection
  publishedAt: OrderDirection
}
input PostWhere {
  id: UUIDCondition
  publishedAt: DateTimeCondition
  and: [PostWhere!]
  or: [PostWhere!]
  not: PostWhere
}
enum OrderDirection {
  asc
  desc
}
type PostConnection {
    pageInfo: PageInfo!
    edges: [PostEdge!]!
}

type PageInfo {
    totalCount: Int!
}

type PostEdge {
    node: Post!
}

```

## Fetching a single record

To fetch a single record using the "get" query in Contember. For example, if you have an entity called "Post", there will be a field called "getPost" with a parameter called "by". To fetch a record, you need to know the unique field that identifies the record.

#### Example: fetching a single Post with the id "c4ae3a0f-d91b-42a8-ad3c-5ca6b9f407c2":
```graphql
query {
	getPost(by: { id: "c4ae3a0f-d91b-42a8-ad3c-5ca6b9f407c2" }) {
		title
		publishedAt
	}
}
```

The "by" parameter allows you to filter by any unique column (or columns in case of a compound unique key). By default, the unique field is "id", but you can specify other unique fields using the `.unique()` method on the column or using the `@def.Unique(...)` class annotation.

You can then specify the fields you want to retrieve in the GraphQL query. In the example above, we are retrieving the "title" and "publishedAt" fields of the Post with the specified id.

You can also use the "get" query to filter by other unique fields, as long as they are defined as unique in your Contember schema. For example, if you have a unique field called "slug" in your Post entity, you can fetch a single Post using the following query:

```graphql
query {
	getPost(by: { slug: "my-awesome-post" }) {
		title
		publishedAt
	}
}
```

The filter argument in a get query allows you to apply additional filters on the result in addition to the unique filter provided by the by argument. You can use the same filter conditions as in the list and paginate queries.

#### Example of how to use the filter argument in a get query:

```graphql
query {
	getPost(
		by: { id: "c4ae3a0f-d91b-42a8-ad3c-5ca6b9f407c2" },
		filter: {
			publishedAt: { lte: "2019-12-20" }
			category: { name: { eq: "Graphql" } }
		}
	) {
		title
		publishedAt
	}
}
```
This query will fetch a single Post record with specified ID and also filter the result to include only those that were published before "2019-12-20" and are in the category with the name "Graphql".


## Fetching a list of records

You can use the list query to fetch a list of records from a specific entity. The list query takes several arguments, including filter, orderBy, offset, and limit, which allow you to narrow down the results and specify the order and pagination of the returned data.


#### Example of how to use the list query to fetch a list of posts:
```graphql
query {
  listPost(
    filter: {
      publishedAt: { lte: "2019-12-20" }
      category: { name: { eq: "Graphql" } }
    }
    orderBy: [{ publishedAt: asc }]
    limit: 10
  ) {
    title
    publishedAt
  }
}
```

This query will fetch a list of posts published before a certain date, ordered by their publication date in ascending order, with a limit of 10 results.

You can use the `filter` argument to apply conditions on the returned data. You can use comparison operators, such as `eq`, `lt`, `contains`, etc., to specify the values that a certain field should or should not have. You can also use logical operators, such as `and`, `or`, and `not`, to combine multiple conditions. For details, see [filters section](#filters) bellow.

The `orderBy` argument allows you to specify the order of the returned data. You can use the `asc` and `desc` values to specify ascending or descending order, respectively. For details, see [sorting results](#sorting-result) bellow.

The offset and limit arguments allow you to specify the pagination of the returned data. The offset argument specifies the number of records to skip, while the limit argument specifies the maximum number of records to return.

## Records pagination

There is an alternative to a list queries with a similar structure - a "paginate" queries. This query aims to be Relay compatible in the future.

The `skip` parameter determines the number of records to skip before returning results, while the `first` parameter determines the maximum number of records to return. The `filter` and `orderBy` parameters work the same way as they do in the `list` query.

Cursor based pagination is not yet supported.

In addition to fields for fetching a list of records, there is a `pageInfo` object with `totalCount` field, which tells you the total number of records that match the filter and sorting criteria. You can use this value to calculate the total number of pages and implement a pagination UI in your application.

#### Example of how to use the "paginate" query

```graphql
query {
  paginatePost(
    skip: 1
    first: 2
    filter: { author: { name: { eq: "John Doe" } } }
    orderBy: [{ publishedAt: asc }]
  ) {
    pageInfo {
      totalCount
    }
    edges {
      node {
        id
        title
        author {
          name
        }
      }
    }
  }
}
```

## Filters

To filter the results of a query in Contember's GraphQL API, you can use the filter argument. This argument takes an input object with fields corresponding to the columns of the entity you are querying. The value of each field can be a condition object specifying how the column should be filtered.

### Comparison operators

| GraphQL name | Description     | Example                                                        | Supported columns
| ------------ | --------------  | ----------------                                               | ------------
| isNull       |  is (not) null                           | `{isNull: true}` or `{isNull: false}` | Everywhere
| eq           |  equal to                                | `{eq: "value"}`                       | Everywhere but JSON
| notEq        |  not equals to                           | `{notEq: "value"}`                    | Everywhere but JSON
| in           |  is in list                              | `{in: ["A", "B"]}`                    | Everywhere but JSON
| notIn        |  is not in list                          | `{in: ["A", "B"]}`                    | Everywhere but JSON
| lt           |  less than                               | `{lt: 100}`                           | Everywhere but JSON
| lte          |  less than or equals to                  | `{lte: 100}`                          | Everywhere but JSON
| gt           |  greater than                            | `{gt: 100}`                           | Everywhere but JSON
| gte          |  greater than or equals to               | `{gte: 100}`                          | Everywhere but JSON
| contains     |  contains a string (case sensitive)      | `{contains: "contember"}`             | String only
| containsCI   |  contains a string (case insensitive)    | `{containsCI: "contember"}`           | String only
| startsWith   |  starts with a string (case sensitive)   | `{startsWith: "contember"}`           | String only
| startsWithCI |  starts with a string (case insensitive) | `{startsWithCI: "contember"}`         | String only
| endsWith     |  ends with a string (case sensitive)     | `{endsWith: "contember"}`             | String only
| endsWithCI   |  ends with a string (case insensitive)   | `{endsWithCI: "contember"}`           | String only

#### Example: GraphQL type for String condition

```graphql
input StringCondition {
  and: [StringCondition!]
  or: [StringCondition!]
  not: StringCondition
  null: Boolean
  isNull: Boolean
  eq: String
  notEq: String
  in: [String!]
  notIn: [String!]
  lt: String
  lte: String
  gt: String
  gte: String
  contains: String
  startsWith: String
  endsWith: String
  containsCI: String
  startsWithCI: String
  endsWithCI: String
}
```

### Logical operators

You can also use the and, or, and not operators to combine multiple filters:

| GraphQL name | Example
| -----------  | --------
| and          | `{and: [{ gte: "2019-12-20" }, { lte: "2019-12-30" }]}`
| or           | `{or: [{isNull: true}, {eq: "value"}]}`
| not          | `{not: {eq: "value"}}`

#### Example how to combine two operators using AND

```graphql
query {
  listPost(
    filter: {
      publishedAt: { and: [{ gte: "2019-12-20" }, { lte: "2019-12-30" }] }
    }
  ) {
    id
    title
  }
}
```

In this example, the `and` logical operator is used to specify that the `publishedAt` field must be greater than or equal to "2019-12-20" and less than or equal to "2019-12-30". This filters the result to only include posts with a `publishedAt` value within this range. The `and` operator can take an array of conditions, which must all be met in order for the overall condition to be `true`. The `or` operator can also be used in a similar manner, with the difference being that at least one of the conditions in the array must be `true` for the overall condition to be `true`. The `not` operator can be used to negate a condition, so that only records that do not match the condition will be included in the result.

:::note
It is not possible to combine multiple fields in a single object. You have to wrap it using `and` or `or` fields.
:::


### Relation filters

Filtering over relationships allows you to apply filters on related entities in a query. This is useful for narrowing down the results of a query by using the properties of related entities. Relation filters can be used on all types of relationships, including "has many".

#### Example: filtering over relation

```graphql
query {
  listPost(
    filter: {
      author: { name: { eq: "John Doe" } }
      tag: { caption: { eq: "graphql" } }
    }
  ) {
    id
    title
  }
}
```

In the above example, the listPost query is being filtered by two relationships - author and tag. For the author relationship, the filter is specifying that the name of the related author must be "John Doe". For the tag relationship, the filter is specifying that the caption of the related tag must be "graphql". This will return all posts that have an author with a name of "John Doe" and a tag with a caption of "graphql".

## Sorting result

To sort the results of a query, you can use the `orderBy` argument in the query. This argument takes an array of objects, where each object represents a field to sort by and the sorting direction (ascending or descending). You can specify multiple fields to sort by and you can also sort by fields on related entities.


#### Example how to sort a list of posts first by the author's name in ascending order and then by the publishedAt field in descending order:
```graphql
query {
  listPost(
      orderBy: [
        { author: { name: asc } },
        { publishedAt: desc }
      ]
  ) {
    id
    title
  }
}
```

In addition to `asc` and `desc`, there are also `ascNullsFirst` and `descNullsLast` which can be used to specify how to handle null values in the sorting. ascNullsFirst will place null values at the beginning of the sorted list, while descNullsLast will place them at the end.


## Nested objects

When working with GraphQL, it is often necessary to traverse relationships between objects to retrieve the data needed.

#### Example 
```graphql
query {
  listPost {
    id
    title
    category {
      name
    }
    author {
      name
    }
  }
}
```

Additionally, you can traverse multiple levels of relationships by nesting fields within each other. 

#### Example how to retrieve the author of each post within a category:

```graphql
query {
	listCategory {
		id
		title
		posts {
			title
			author {
				name
			}
		}
	}
}
```

On "has many" relations, you can also set a filter, orderBy and limit with an offset.

#### Example how to use parameters on has-many relations
```graphql
query {
  listCategory {
    id
    title
    posts(limit: 3, orderBy: [{ publishedAt: desc }]) {
      title
    }
  }
}
```

On both "has many" and "has one" relations, you can apply additional filters using the same syntax as with "list" queries.

#### Example how to fetch all posts, but category is filtered to only match given filter:
```
query {
	listPost {
		id
		title
		category(filter: { name: { eq: "GraphQL" } }) {
			name
		}
	}
}
```


## Narrowed has many

You can use the narrowed has many to filter a "has many" relation by a field of a compound unique key, where the second part of the unique key references the entity that you are querying. This allows you to access a specific record within the "has many" relation. 

For example, consider the following schema:
```typescript
export class Category {
	translations = d.oneHasMany(CategoryTranslation, 'category'))
	internalNote = def.stringColumn()
}

@d.Unique('category', 'locale')
export class CategoryTranslation {
	category = d.manyHasOne(Category, 'translations').cascadeOnDelete().notNull()
	locale = d.stringColumn().notNull()
	name = d.stringColumn()
}
```

With this schema, you can use the following GraphQL query to access a specific translation for a category, filtered by the "locale" field:

```
query {
	listCategory {
		id
		translationsByLocale(by: {locale: "en"}) {
			name
	}
}
```
This will return single translation for the specified locale for each category in the result set, even though the relation is defined as "has many".

## Transactions

It's important to note that transactions are not automatically started for queries. This is done to improve performance, but it also means that you may experience inconsistency in the results.

The transaction field allows you to wrap multiple queries into a single transaction. This ensures that all the queries are executed atomically.

#### Example how to use transactions in queries
```
query {
  transaction {
    listPost {
      title
    }
    listAuthor {
      name
    }
  }
}
```

This will ensure that the `listPost` and `listAuthor` queries are executed within a single transaction, ensuring consistency in the results.
