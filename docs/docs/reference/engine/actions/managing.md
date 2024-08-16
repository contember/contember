---
title: Actions management
---

# <span className="version">Engine EE 1.3+</span> Actions management

The Actions Management API in Contember provides a GraphQL interface for managing Action events and variables in your project. You can access the API by making GraphQL requests to the `/actions/<project-name>` endpoint, where `project-name` represents the name of your Contember project.

## Permissions
You must include a Bearer token in Authorization header. To view and setup variables, you need either `admin` or `deployer` role. To interact with other Actions Management APIs, the `admin` role is required. It is not yet possible to configure these permissions.

## Managing Variables

Variables are dynamic values that can be used to customize the behavior of your Actions. These variables can be referenced in your Actions' configurations using double curly brackets `{{}}`, e.g. `{{baseUrl}}`.

### Retrieving Variables:
To retrieve the variables defined for your Contember project, you can make a GraphQL query to the `variables` field. This will provide you with a list of variables, including their names and current values. 

Example:

```graphql
query {
  variables {
    name
    value
  }
}
```

### Updating Variables

To update the values of variables, you can use the `setVariables` mutation. This allows you to modify one or more variables simultaneously, depending on your requirements. The mutation accepts an array of `VariableInput` objects, where each object includes the variable name and the new value. These updated values can then be referenced in your Actions' configurations.

Example:

```graphql
mutation {
  setVariables(args: {
    variables: [
      { name: "apiKey", value: "new-api-key-value" },
      { name: "baseUrl", value: "http://localhost/foo-bar" }
    ]
		# mode: MERGE
  }) {
    ok
  }
}
```

In this example, we are updating two variables, `apiKey` and `baseUrl`, with their respective new values. The mutation will return a boolean `ok` field indicating whether the update was successful.

#### Variable update mode

The `mode` field in the `SetVariablesArgs` input of `setVariables` mutation allows you to specify how the mutation should handle the original variables when updating their values. 

1. MERGE (Default Behavior):
	- When `mode` is set to `MERGE`, the new variable values provided in the mutation will be merged with the existing variable values.
	- Existing variables that are not included in the mutation will retain their current values.
	- If a variable is included in the mutation, its value will be updated with the new value provided.

2. SET:
	- When `mode` is set to `SET`, all existing variables will be replaced with the new variable values provided in the mutation.
	- This means that any variables not included in the mutation will be removed.
	- Use caution when using the `SET` mode, as it completely replaces all existing variables.

3. APPEND_ONLY_MISSING:
	- When `mode` is set to `APPEND_ONLY_MISSING`, the new variable values provided in the mutation will be appended to the existing variables only if they do not already exist.
	- Existing variables that are not included in the mutation will retain their current values.
	- If a variable is included in the mutation and it already exists, its value will not be updated.


## Event queries

The Actions API provides several queries to retrieve information about events triggered by Actions. These queries allow you to monitor the status, details, and progress of events within your project. Here are the available queries for retrieving events:

### failedEvents query
	
- Retrieves a list of failed events (failed or retrying).
- Events are sorted based on the last state change in descending order.
- Returns an array of `Event` objects that represent events with a failed state.

#### Example: retrieving failed events

```graphql
query {
  failedEvents {
    id
    target
    log
  }
}
```

Explore the `log` field to extract any relevant error messages and gain further insights into the issues encountered during event processing.

### eventsToProcess query

- The  query returns events that are visible and awaiting processing (processing, created and retrying).
- The events are sorted based on visibility in ascending order.

:::note
Visibility refers to the point in time when an event becomes eligible for processing. Events with a timeout after failure may not immediately become visible.
:::

#### Example: retrieving events ready to be processed

```graphql
query {
  eventsToProcess {
    id
    createdAt
    lastStateChange
    numRetries
    state
    target
  }
}
```

### eventsInProcessing: query

- The query returns events that are in the "processing" state.
- The events are sorted based on the lastStateChange property in ascending order.

#### Example: retrieving events in processing

```graphql
query {
  eventsInProcessing {
    id
    createdAt
    lastStateChange
    numRetries
    state
    target
  }
}
```


### Pagination

- The args input object allows you to specify the offset and limit parameters for pagination.
- Adjust the offset value to retrieve events from a specific position in the result set.
- Modify the limit (default 100) value to control the maximum number of events to be returned in a single query.

## processBatch mutation

The `processBatch` mutation in the Actions API allows you to manually trigger a batch processing of events within your Contember project. This mutation is an alternative to starting the Actions worker using the `CONTEMBER_APPLICATION_WORKER: 'all'` configuration. The `processBatch` mutation returns a simple response object indicating the success of the batch processing. Here is an overview of the `processBatch` mutation:

Mutation:

```graphql
mutation {
  processBatch {
    ok
  }
}
```

