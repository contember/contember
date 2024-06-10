---
title: Actions
---

# <span className="version">Engine EE 1.3+</span> Actions overview

Actions in Contember provide developers with a powerful way to keep track of entity changes and trigger webhooks in response. With the use of Actions, developers can automate workflows, interface with external systems, and optimize their application's overall performance.

To configure an Action, you need to employ the decorator syntax provided by Contember. Below is an example of an Action definition to demonstrate its structure:

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
  webhook: 'https://example.com/book/updated',
})
export class Book {
  title = def.stringColumn();
  tags = def.manyHasMany(Tag);
  category = def.manyHasOne(Category);
}
```

In this example, we've defined an Action for the `Book` entity in Contember. The Action is set up to monitor the creation, deletion, and changes in the `title` field of the `Book` entity, along with modifications in the `tags` relation. It detects when tags are added or removed from a book, or when a tag's name changes. If any of these monitored fields or relations are altered, Contember triggers the assigned webhook. This enables the automation of workflows, integration with external systems, or execution of custom actions.

Subsequent sections of this documentation will provide a more detailed understanding of Actions, including how to configure them, customize payloads, utilize best practices, and more. Let's tap into the full capabilities of Actions in Contember and streamline your development process.

- [Defining Actions](./definition.md)
- [Managing Actions](./managing.md)
- [Webhook invocation](./invocation.md)

:::caution Direct database changes
Contember tracks modifications made to data through the Contember Engine. It's important to be aware that if a user modifies data directly in the database bypassing Contember, such changes will not trigger the associated events. Events are only fired when modifications are performed using the Contember API or other supported mechanisms within the Contember ecosystem.
:::

## Engine 1.3 Feature {#1-3-feature}

Please be aware that Actions are part of Contember 1.3, which is currently in the RC stage.

## Enterprise / Cloud Exclusive Feature

This feature is not included in the Contember open-source edition but is part of the Contember Enterprise Edition (EE). Actions can also be enabled on Contember Cloud.

![Contember Cloud Actions](/assets/actions-enable.png)

## Local Development

To use Actions in your local Contember projects, the `contember/engine-ee` Docker image is required. The Contember Enterprise Edition is freely available for development and testing purposes. To trigger webhooks and Actions, ensure that the Actions worker is enabled. The `CONTEMBER_APPLICATION_WORKER` environment variable can be set to 'all' in your Docker Compose configuration for the Contember Engine service.

#### Docker Compose configuration update:

```yaml
services:
  contember-engine:
    image: contember/engine-ee:1.3.0-rc
    environment:
      CONTEMBER_APPLICATION_WORKER: 'all'
      # other environment variables
```

In this updated configuration, the `image` field has been changed to `contember/engine-ee:1.3.0-rc`, enabling the use of the Contember Enterprise Edition (EE) with Actions support. The `CONTEMBER_APPLICATION_WORKER` environment variable has also been introduced and set to `'all'`.

You can also manually trigger webhooks using the [Actions management API](./managing.md).

:::caution Upgrading from previous Contember versions
If you're upgrading from previous versions of Contember, you'll need to change the version in several places. One is the engine as seen above, another is the image for Contember CLI (`contember-cli`) and the last are packages for `@contember/schema` and `@contember/schema-definition`.
:::
