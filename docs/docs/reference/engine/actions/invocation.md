---
title: Webhook invocation
---

# <span className="version">Engine EE 1.3+</span> Webhook Invocation in Actions

After a watched event on a monitored entity is registered, it is queued within the actions queue. The Actions worker waits for these events to be dispatched and triggers the corresponding webhooks configured for the events.

## Batching

To optimize efficiency, events targeting the same webhook can be batched together, allowing for processing multiple events in a single invocation. By default, each batch contains a single event, and the event payload is wrapped in an array. However, you can adjust the `batchSize` property in the webhook configuration to specify the maximum number of events per batch.

It's important to note that when processing a batch, all events within the batch are considered either successful or failed based on the HTTP response code. Currently, partial success for individual events within a batch is not supported. If any event in the batch fails, the entire batch is considered failed.

## Fetching events

The worker identifies events ready for processing based on their visibility, selecting events with the lowest visibility first. It then groups together events with the same target to form a batch. The payload for each event is already constructed when it is saved to the queue, simplifying the worker's role to dispatching the batched payloads.

## Payload Construction and Variable Replacement

In the webhook URL and header values, variables can be used using double curly braces (`{{variableName}}`). These variables are replaced with their corresponding values at the time of webhook invocation. It provides flexibility and customization by allowing dynamic content based on the context of the
event.

By default, Contember appends the following headers to the webhook request:

- `User-Agent: Contember Actions`
- `Content-Type: application/json`

These headers identify the source of the webhook request and specify the format of the payload.

## Request payload

When a batch of events is dispatched and the corresponding webhook is invoked, the payload sent to the webhook contains a field named `events`. This field holds an array of event payloads representing the batched events. Each event payload follows a specific structure based on the type of event triggered.
 

#### Example: webhook body
```json5
{
  "events": [ 
    {
      "id": "...",
      "entity": "...",
      "type": "watch",
      // ...
    },
    /// other events
  ]
}
```

:::caution
Even when a batch is configured to contain only a single event, it is still sent in the `events` field as an array with a single item. This consistent structure allows for unified handling of batched events, ensuring consistent processing logic regardless of the number of events in the batch.
:::

### Watch Event Payload

A `watch` event payload represents a change in the watched entity and provides detailed information about the change. Here is the structure of a `watch` event payload:

- `id` (string or int): The unique identifier of the entity event.
- `entity` (string): The entity type of the watched entity.
- `events` (array of objects): An array of event payloads representing the changes in the watched entity. Each event payload has the following properties:
  - `id` (string): The unique identifier for the event.
  - `path` (array of string): The path to this entity relative to the watched entity.
  - `entity` (string): The entity type of the event.
  - `operation` (string): The type of operation performed on the entity, such as `create`, `update`, `delete`, `junction_connect`, or `junction_disconnect`.
  - [other fields based on operation type](#basic-events)
- `trigger` (string): The name of the trigger associated with the event.
- `operation` (string): The operation type of the event, which is set to `watch` for a watch event.
- `selection` (object): Custom payload defined by `selection` on a watch definition
- `meta` (object): [see event meta](#event-metadata)

#### Example: a body payload with a `watch` event payload for a `Book` entity:

```json
{
	"events": [
		{
			"id": "f4f0a97d-7850-4add-8946-a1ce016306ce",
			"entity": "Book",
			"events": [
				{
					"id": "f4f0a97d-7850-4add-8946-a1ce016306ce",
					"entity": "Book",
					"values": {
						"title": "Sample Book Title"
					},
					"operation": "update"
				}
			],
			"trigger": "book_updated_watch",
			"operation": "watch",
			"selection": {},
			"meta": {
				"eventId": "73bbf733-36a5-4e5c-8798-1ba1b7900b39",
				"transactionId": "53e3790d-5485-490c-9420-a1e79b19b5d3",
				"createdAt": "2023-07-25T15:30:17.937Z",
				"lastStateChange": "2023-07-25T15:30:17.937Z",
				"numRetries": 0,
				"trigger": "book_updated_watch",
				"target": "book_updated_watch_target"
			}
		}
	]
}
```

In this example, the `watch` event payload represents an update operation on a `Book` entity. It includes the updated value of the `title` property. The `operation` is set to `update`, and the associated trigger is `book_updated_watch`. Additional information, such as the selection of fields, can be included in the `selection` property if specified in the watch configuration.

### Trigger Event Payload

Trigger event payloads represent payloads for events invoked by `trigger` and contains individual basic events.

- `id` (string or int): The unique identifier for the entity.
- `entity` (string): The entity type associated with the event.
- `operation` (string): The type of operation performed on the entity. Possible values are `create`, `update`, `delete`, `junction_connect`, or `junction_disconnect`.
- `selection` (object, optional): Additional information about the selected fields in the event, if specified in the event configuration.
- `meta` (object): [see event meta](#event-metadata)
- [other fields based on operation type](#basic-events)

Here's an example of a basic event payload for an `update` operation on a `Book` entity:

#### Example: a body payload with a `update` event payload for a `Book` entity:
```json
{
	"events": [
		{
			"id": "f4f0a97d-7850-4add-8946-a1ce016306ce",
			"entity": "Book",
			"values": {
				"title": "Updated Book Title",
				"author": "John Doe"
			},
			"operation": "update",
			"selection": {},
			"trigger": "book_updated_watch",
			"meta": {
				"eventId": "73bbf733-36a5-4e5c-8798-1ba1b7900b39",
				"transactionId": "53e3790d-5485-490c-9420-a1e79b19b5d3",
				"createdAt": "2023-07-25T15:30:17.937Z",
				"lastStateChange": "2023-07-25T15:30:17.937Z",
				"numRetries": 0,
				"trigger": "book_updated_watch",
				"target": "book_updated_watch_target"
			}
		}
	]
}
```

In this example, the basic event payload represents an `update` operation on a `Book` entity. It includes the updated values of the `title` and `author` properties. The `operation` is set to `update`, and the `id` identifies the specific book entity. The `selection` and `path` properties are optional and provide additional context or information about the event within the entity graph.

## Event Metadata

Each event within the webhook payload contains metadata that provides essential information about the event. The event metadata, available under the `meta` field, includes the following properties:

- `eventId` (UUID string): A unique identifier for the event. This identifier can be used to track and reference the event throughout your system.
- `transactionId` (UUID string): The identifier for the transaction associated with the event. This can be helpful for managing the event within a transactional context.
- `createdAt` (ISO 8601 string): The timestamp indicating when the event was created. It represents the moment when the event was initially recorded.
- `lastStateChange` (ISO 8601 string): The timestamp of the last state change for the event. It indicates when the event's state was last modified or updated.
- `numRetries` (int): The number of times the event has been retried. This count can help you track the number of retry attempts made for the event.
- `trigger` (string): The name of the trigger or watch that caused the event.
- `target` (string): The name of target associated with the event.

### Basic events

Basic event payloads represent individual operations performed on entities. They provide information about the specific operation and the changes made to the entity.

```typescript
export type UpdateEvent = {
  operation: 'update'
  entity: string
  id: PrimaryValue
  values: JSONObject
  old?: JSONObject
}

export type CreateEvent = {
  operation: 'create'
  entity: string
  id: PrimaryValue
  values: JSONObject
}

export type DeleteEvent = {
  operation: 'delete'
  entity: string
  id: PrimaryValue
}

export type JunctionConnectEvent = {
  operation: 'junction_connect'
  entity: string
  id: PrimaryValue
  relation: string
  inverseId: PrimaryValue
}

export type JunctionDisconnectEvent = {
  operation: 'junction_disconnect'
  entity: string
  id: PrimaryValue
  relation: string
  inverseId: PrimaryValue
}
```

## Processing timeout 

A timeout is enforced for webhook completion to ensure timely processing. By default, the timeout is set to 30 seconds, but it can be adjusted in the webhook configuration (using `timeoutMs` prop). If a webhook fails to respond within the specified timeout, all events in the batch are marked as "retrying." 

## Response Processing

When processing the response received from a webhook invocation, Contember follows specific rules to determine the success or failure of the batched events. Here's an overview of the response processing rules:

1. **Not-OK Response Status**: If the HTTP response status falls outside the 2xx range (i.e., it is not considered OK), the entire batch is considered unsuccessful. Detailed information about the failure is stored in the `log` field of each event.

2. **OK Response Status with Specific Non-Empty Body**: If the HTTP response status is within the 2xx range (OK) and the response body contains a valid JSON object with a `failures` key, the response is further analyzed:
    - **Invalid Structure or unknown `eventId`**: If the structure of the response doesn't adhere to the required format (`failures` must contain an array of objects containing an `eventId` (UUID format) and optionally an `error` (string format)) or if the `eventId` present in the response does not correspond with any event in the batch, the entire batch is considered unsuccessful.
    - **Valid Structure and `eventId`**: If the structure of the response is as expected and the `eventId` in the response matches an event in the batch, only the events specified in the `failures` field are marked as unsuccessful, while the remaining events are deemed successful.

3. **OK Response Status with Empty or Other Non-Specific Body**: If the HTTP response status is OK (2xx) and the response body is either empty or contains anything other than a valid JSON object with a `failures` key, the entire batch is treated as successful, ignoring the specifics of the response content.


Following the processing of the response, the standard retry mechanism is applied to the events that were marked as unsuccessful. This ensures that the unsuccessful events are retried according to the configured retry logic, allowing for subsequent attempts to process them successfully.

#### Example: webhook response payload with the `failures` field indicating event failures:

```json
{
  "failures": [
    {
      "eventId": "f4f0a97d-7850-4add-8946-a1ce016306ce",
      "error": "Invalid input"
    },
    {
      "eventId": "a2b1c3d4-5678-90e1-2345-678f9g0h12i",
      "error": "Service not available"
    }
  ]
}
```

In this example:

- Two events within the batch are marked as failures.
- The `eventId` field uniquely identifies each failed event. This id matches the `eventId` in a `meta`.
- The `error` field provides additional information about the cause of the failure, such as an error message or a specific reason for the event processing failure.

## Retries

Contember follows a retry strategy for events marked as "retrying." By default, the initial repeat interval between retry attempts is set to 5,000 milliseconds (can be changed using `initialRepeatIntervalMs` webhook prop), and it follows an exponential backoff strategy for subsequent retries. The interval between retries doubles with each attempt until the maximum number of attempts is reached. The maximum number of attempts is set to 10 (`maxAttempts` prop in webhook configuration), meaning Contember will attempt to send the webhook request a maximum of 10 times before considering it as a failure.
