---
title: GraphQL Mutations
---

Contember offers advanced mutations for data modification. For every entity there are 4 operations available - create, update, delete and upsert. A GraphQL schema for your entity Post will look like this:

```graphql
type Mutation {
  createPost(data: PostCreateInput!): PostCreateResult!
  deletePost(by: PostUniqueWhere!): PostDeleteResult!
  updatePost(by: PostUniqueWhere!, data: PostUpdateInput!): PostUpdateResult!
  upsertPost(by: PostUniqueWhere!, update: PostUpdateInput!, create: PostCreateInput!): PostUpsertResult!
}
```  

## Creating records

Using a `create` mutation you can create new records. Under `node` field you can fetch inserted record with a generated identifier.

```graphql
mutation {
  createPost(data: {title: "Hello world", publishedAt: "2019-12-20"}) {
    ok
    node {
      id
    }
  }
}
```

## Updating records

Use an `update` mutation to change existing record. For this operation, you need an unique identifier of the record. It can be either an ID or any other custom unique field. Using `node` field, you can fetch updated record.

```graphql
mutation {
  updatePost(
    by: {id: "97644abb-0671-486b-9c51-b72b377ec1d9"}
    data: {title: "Hello Contember"}
  ) {
    ok
    node {
      id
    }
  }
}
```

## Deleting records

Use a `delete` mutation you can delete records. You also need a unique identifier for this operation. Using `node` field you can fetch a record before it is actually deleted. 

```graphql
mutation {
  deletePost(
    by: {id: "97644abb-0671-486b-9c51-b72b377ec1d9"}
  ) {
    ok
    node {
      title
    }
  }
}
```

## Upserting records

`upsert` is a special operation, which updates an existing row or a creates a new one when the requested row does not exist. Beside the unique identifier you must provide two data inputs - one for creating and one for updating existing row.

Using `node` field, you can fetch updated/created record.

```graphql
mutation {
  upsertPost(
    by: {slug: "hello-contember"}
    create: {title: "Hello Contember"}
    update: {title: "Hello Contember again!"}
  ) {
    ok
    node {
      id
    }
  }
}
```

## Mutations on relations

In a single mutation, you can execute nested mutations on relations using this operations:

- `connect` - connects a record you specify by unique identifier.
- `disconnect` - disconnects record. For "has many" relations, you have to identify a record using unique identifier
- `create` - creates a record and connects it automatically after that.
- `update` - updates referenced record. For "has many" relations, you have to identify a record using unique identifier
- `delete` - deletes referenced record. For "has many" relations, you have to identify a record using unique identifier
- `upsert` - updates given record or creates a new record when there is nothing to update

:::note
If you are e.g. connecting a record, which does not exist, the mutation will fail.
:::

```graphql
mutation {
  createPost(data: {
    title: "Hello world"
    category: {connect: {id: "af86a9a3-349a-412f-b95b-725c4b9061b8"}}
    tags: [{create: {name: "graphql"}}]
  }) {
    ok
  }
}
```   

## Transactions

Each mutation (with its nested mutations) is wrapped into individual transaction, meaning that for query:
```graphql
mutation {
  post1: createPost(data: {
    title: "Hello world"
    tags: [{create: {name: "graphql"}}]
  }) {
    ok
  }
  post2: createPost(data: {
    title: "Lorem ipsum"
    tags: [{create: {name: "contember"}}]
  }) {
    ok
  }
}
``` 

There will be two database transaction. 

If you need to wrap it into a single transaction, use `transaction` mutation:
```graphql
mutation {
  transaction {
    post1: createPost(data: {
      title: "Hello world"
      tags: [{create: {name: "graphql"}}]
    }) {
      ok
    }
    post2: createPost(data: {
      title: "Lorem ipsum"
      tags: [{create: {name: "contember"}}]
    }) {
      ok
    }
    ok
  }
}
```

If anything goes wrong, whole transaction is rolled back.

As you can see in the example, you can get the result of mutation (`ok` field but also errors, validation etc.) on both levels. 


## Batch operations

Currently there are no mutations for batch updates available. But you can always connect to a PostgreSQL and execute an update using SQL.
