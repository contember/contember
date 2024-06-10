---
title: Actions definition
---

# <span className="version">Engine EE 1.3+</span> Actions definition

This section of the documentation will guide you through the syntax and definition of Actions, facilitating their optimal utilization within your applications.

:::note
Keep in mind, whenever you add or modify Actions in Contember, it's essential to create and apply schema migrations. This ensures your changes are correctly integrated. You can learn more about [migrations](../migrations/overview.md).
:::

## Defining a Watch Action

The watch action in Contember Actions allows you to track and monitor specific changes within an entity. When you define a watch action, Contember automatically keeps track of the creation, deletion, and updates of the entity, as well as any changes made to the watched fields and relations.

To define a Watch Action, you employ decorator syntax. The `@watch` decorator is attached to the entity class you aim to observe for changes.

#### Example: Basic structure of a Watch Action definition:

```javascript
import { SchemaDefinition as def, ActionsDefinition as actions } from '@contember/schema-definition'

@actions.watch({
  name: 'action_name',
  watch: `fields_to_watch`,
  webhook: 'webhook_url',
  selection: 'optional_selection_for_payload',
})
export class YourEntity {
  // Entity properties and relationships
}
```

- `name`: Assigns a unique name for the Action, which can serve for reference or identification.
- `watch`: Determines the fields and relations to track for changes. A GraphQL-like syntax can be used to designate the fields and relations to observe. This includes both direct fields of the entity as well as fields within related entities.
- `webhook`: Provides the URL to which the webhook notification will be directed when changes occur. [see advanced configuration](#webhook-configuration)
- `selection` (optional): Specifies the selection that will be dispatched in a payload.

## Defining a Trigger Action

Trigger Actions in Contember serve as a lower-level alternative to watch-based Actions, giving you the ability to selectively observe specific operations on an entity. These operations can include creation, deletion, or updates to specified fields. By providing precise control over which operations initiate your webhook, Trigger Actions let you concentrate on tracking the specific changes that matter to your application.

To define a Trigger Action, you attach the `@trigger` decorator to the entity class you wish to monitor.

#### Example: Basic structure of a Trigger Action definition:

```typescript
import { SchemaDefinition as def, ActionsDefinition as actions } from '@contember/schema-definition'

@actions.trigger({
  name: 'action_name',
  create: true,
  delete: true,
  update: ['field_to_watch'], // or "true"
	selection: 'optional_selection_for_payload',
	webhook: 'webhook_url'
})
export class YourEntity {
  // Entity properties and relationships
}
```

- `name`: Provides a unique name for the Trigger Action, usable for reference or identification purposes.
- `create` (optional): Indicates whether the webhook should be triggered when a new entity is created.
- `delete` (optional): Specifies whether the webhook should be triggered when an entity is deleted.
- `update` (optional): Determines whether the webhook should be triggered when an entity is updated. This can be set to `true` to trigger on any update, or to an array of field names to trigger only when those specific fields are modified.
- `webhook`: Provides the URL to which the webhook notification will be directed when changes occur. [see advanced configuration](#webhook-configuration)
- `selection` (optional): Lets you include specific fields in the payload sent to the webhook, allowing fine-grained control over the data included in the notification.

#### Example: Defining a Trigger Action

```javascript
import { SchemaDefinition as def, ActionsDefinition as actions } from '@contember/schema-definition'

@actions.trigger({
  name: 'book_created',
  create: true,
  selection: `
    title
    author {
      name
    }
  `,
  webhook: 'https://example.com/book/created',
})
export class Book {
  title = def.stringColumn();
  author = def.manyHasOne(Author);
}
```

With the provided Trigger Action configuration, the webhook will be invoked whenever a new `Book` entity is created. The payload dispatched to the webhook will include the defined fields (`title` and `author.name`), allowing you to execute custom actions or alert external systems about the creation event.

## Payload and Selection

By default, the payload that is sent to the webhook encapsulates the changes that triggered the Action. However, you can personalize the payload by defining a `selection` property within both `@watch` and `@trigger` decorators. The `selection` property enables you to incorporate specific fields in the payload, offering fine-grained control over the data dispatched to the webhook.

Example: Defining a selection within a watch

```typescript
import { SchemaDefinition as def, ActionsDefinition as actions } from '@contember/schema-definition'

@actions.watch({
	name: 'order_watch',
	watch: `
    status
    customer {
      name
      email
    }
  `,
	webhook: 'https://example.com/order/updated',
	selection: `
    status
    customer {
      name
    }
  `,
})
export class Order {
	// Entity properties and relationships
}
```

## Webhook Configuration

The `webhook` property determines the URL where the webhook notification will be dispatched. This could be an external service or an endpoint within your own application that processes the webhook payload.

### Advanced Webhook Options

Instead of defining a simple string for the `webhook` property, you have the option to pass an object that allows for a more detailed configuration of the webhook. This feature gives you the ability to set additional headers, specify timeouts, manage retry attempts, and adjust the batching of webhook requests. Below is an example demonstrating how to leverage these advanced options:

```javascript
import { SchemaDefinition as def, ActionsDefinition as actions } from "@contember/schema-definition"

@actions.watch({
  name: 'book_watch',
  watch: `
    title
    tags {
      name
    }
  `,
  webhook: {
    url: 'https://example.com/book/updated',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    timeoutMs: 5000,
    maxAttempts: 5,
    initialRepeatIntervalMs: 2000,
    batchSize: 10,
  },
})
export class Book {
  // Entity properties and relationships
}
```

In the provided example, the `webhook` property is defined as an object containing the following advanced options:

- `url`: Defines the URL where the webhook notification should be dispatched.
- `headers` (optional): Lets you add custom headers to the webhook request. You can provide an object containing key-value pairs that represent header names and their corresponding values.
- `timeoutMs` (optional): Sets the timeout duration in milliseconds for the webhook request. If the request lasts longer than the set timeout, it will be marked as unsuccessful.
- `maxAttempts` (optional): Determines the maximum number of attempts to dispatch the webhook request in case of failures or errors.
- `initialRepeatIntervalMs` (optional): Establishes the initial interval duration in milliseconds between repeated attempts to dispatch the webhook request. This interval utilizes an exponential backoff strategy, doubling with each attempt until the maximum attempts are reached.
- `batchSize` (optional): Lets you manage the maximum number of events included in a single payload when sending batched requests.

By making use of these advanced webhook options, you can tailor the behavior, reliability, and efficiency of your webhook integration in Contember. Feel free to adjust these options based on your unique requirements and the specifications of your target webhook endpoint.

### Using Variables in Webhook URLs and Headers

Variables can be employed within the webhook URLs and header values of your Actions, facilitating dynamic and adaptable configurations tailored to different environments or specific requirements. Variables are enclosed in double curly braces (e.g., `{{variableName}}`) and can be inserted in both the webhook URL and header values.

#### Example: Using variables in URL and headers:

```javascript
import {SchemaDefinition as def, ActionsDefinition as actions} from "@contember/schema-definition"

@actions.watch({
  name: 'book_watch',
  watch: `
    title
    tags {
      name
    }
  `,
  webhook: {
    url: `{{baseWebhookUrl}}/book/updated`,
    headers: {
      'Authorization': 'Bearer {{apiKey}}',
      'Content-Type': 'application/json',
    },
  },
})
export class Book {
  // Entity properties and relationships
}
```

In this example, the `baseWebhookUrl` variable is employed to denote the base URL for the webhook endpoint. By including the variable in the `url` property of the `webhook` object, you can effortlessly alter the base URL as needed, which enhances flexibility and maintainability.

The example also demonstrates the usage of the `{{apiKey}}` variable within the `headers` object. This feature enables you to dynamically assign the authorization token for the webhook request, making it adaptable to a variety of scenarios.

The managementof these variables are explained in greater detail in the upcoming section, [Managing Actions](./managing.md), where you'll learn how to handle variables and set their values.

### Using separate targets for shared configuration

Contember enables the use of an alternative syntax that separates webhook targets for shared webhook configurations. This method promotes the reuse of identical webhook configurations across multiple Actions, granting flexibility for enabling or disabling watches, while preserving the target definition. Here's an example illustrating this syntax:

```javascript
import {SchemaDefinition as def, ActionsDefinition as actions} from "@contember/schema-definition"

export const myOrderUpdateTarget = actions.createTarget({
  name: 'my_order_update_target',
  type: 'webhook',
  url: 'http://localhost',
});

@actions.watch({
  target: myOrderUpdateTarget,
  name: '...',
  watch: '...',
})
export class Foo {
  // Entity properties and relationships
}
```

In this sample, a separate webhook target named `myOrderUpdateTarget` is defined using the `createTarget()` function. The target configuration includes properties such as `name`, `type`, and `url`. The `type` property is assigned `'webhook'`, signifying that this target corresponds to a webhook endpoint.

To link the webhook target with an Action, the `target` property within the `@watch` decorator instead of the traditional `webhook` property. This facilitates referencing the shared webhook target for the specified Action. The remainder of the configuration, including the `name` and `watch` properties, stays consistent.

This method also permits the disabling of the watch while retaining the target definition, enabling any pending events to be dispatched even when the watch is inactive.

## Events Priority

Contember Actions facilitates event prioritization in `watch` and `trigger` actions. Considering that events from various actions are stored and processed in a single queue, the ability to assign priority levels to certain events is significant. Higher priority ensures these events are processed ahead of others, which is especially beneficial for critical operations or time-sensitive tasks.

To assign priority for a `watch` or `trigger` action, include the `priority` property in the action configuration. The `priority` value should be a positive integer, with higher values indicating higher priority. Consequently, events associated with a higher priority value will precede those with lower priority values during processing.

Below is an example of assigning priority to a `watch` action:

```typescript
import { SchemaDefinition as def, ActionsDefinition as action } from "@contember/schema-definition"

@action.watch({
  name: 'book_watch',
  watch: `
    title
    tags {
      name
    }
  `,
  webhook: 'https://example.com/webhook',
  priority: 2
})
export class Book {
  // Entity definition
}
```

In this example, the `watch` action 'book_watch' is assigned a priority level of 2. Therefore, events triggered by changes in the 'title' or 'tags' fields of the 'Book' entity will have a processing priority level of 2 in the event queue.
