---
title: Event log and history
---

Every operation changing the content is logged in an event log.

:::note events and migrations
Events in event log are NOT transformed when you execute a migration.
:::

## Querying the event log

Anyone with [history permission](/reference/engine/schema/acl.md#history) can query the event log. You can do it by sending GraphQL `events` query to `/system/<project>` endpoint.

#### Example: listing events

```graphql
query {
    events {
        id
        # ...
    }
}
```

### Event log: fields

There are 3 GraphQL types of events: `UpdateEvent`, `CreateEvent` and `DeleteEvent` with following fields available 

:::note fields availability
Fields `oldValues`, `diffValues` and `newValues` are available only for some event types. See notes in table below. 
:::

| Field               | GraphQL Type | Description |
| ------              | ----         | ----------- |
| id                  | `String!`    | Unique identifier of the event |
| type                | `EventType!` | One of `UPDATE`, `DELETE` and `CREATE` |
| createdAt           | `DateTime!`  | When the event was created |
| appliedAt           | `DateTime!`  | When the event was applied (transaction was committed) |
| identityId          | `String!`    | Identity ID of the user who performed the operation |
| identityDescription | `String!`    | Description of the user who performed the operation |
| tableName           | `String!`    | Name of the table affected by the event |
| primaryKey          | `[String!]!` | Primary key of the row affected by the event (for entities it contains a single element with it's id, for ManyHasMany junction tables it contains IDs of both entities) |
| oldValues           | `Json!`      | Old value of the row affected by the event (available only on `UpdateEvent` and `DeleteEvent`)|
| diffValues          | `Json!`      | Diff between old and new values of the row affected by the event (available only on `UpdateEvent`)|
| newValues           | `Json!`      | New value of the row affected by the event (available only on  `CreateEvent`)|

### Event log: filtering, sorting and pagination

Using `args` (of type `EventArgs`) argument you can filter, sort and paginate the event log. 


Here is structure of `EventArgs` type:

```graphql
input EventsArgs {
  stage: String
  filter: EventsFilter
  order: EventsOrder
  offset: Int
  limit: Int
}
enum EventType {
  UPDATE
  DELETE
  CREATE
}
enum EventsOrder {
  CREATED_AT_ASC
  CREATED_AT_DESC
  APPLIED_AT_ASC
  APPLIED_AT_DESC
}

input EventsFilter {
  types: [EventType!]
  rows: [EventFilterRow!]
  tables: [String!]
  transactions: [String!]
  identities: [String!]
  createdAt: EventsFilterDate
  appliedAt: EventsFilterDate
}

input EventsFilterDate {
  from: DateTime
  to: DateTime
}

input EventFilterRow {
  tableName: String!
  primaryKey: [String!]!
}
```

#### Example: getting last 100 events creating an article

```graphql
query {
  events(args: {
    filter: {
      types: [CREATE],
      tables: ["article"],
    },
    limit: 100,
    order: APPLIED_AT_DESC,
  }) {
    id
    identityId
    appliedAt
    ... on CreateEvent {
      newValues
    }
  }
}
```
