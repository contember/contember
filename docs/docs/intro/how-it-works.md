---
title: "How Contember Works: Streamlining Web Application Development"
---

import DocsCard from '../../src/components/global/DocsCard';
import DocsCards from '../../src/components/global/DocsCards';

**Contember**  is an open-source platform that significantly streamlines the process of building and managing data-driven web applications, providing developers with a comprehensive suite of tools to simplify both front-end and back-end operations.

![contember diagram](/assets/contember-diagram.svg)

## Contember Engine: Simplified Backend Operations

**Contember Engine** empowers developers to define data models using TypeScript, subsequently generating a corresponding GraphQL API. This engine functions as a standalone server, offering two main components:

1. **Content API**: A comprehensive GraphQL API for your data.
2. **Tenant API**: An authentication and authorization system to control data access.

The Contember Engine doesn't just facilitate defining data structures and implementing APIs, it also manages your data in a well-structured PostgreSQL database, handling all database-related tasks, including automatic migrations.

## Contember Interface: Efficient UI Building

**Contember Interface** is a React-based SDK, designed to expedite the process of building custom management interfaces. Developers can define their user interfaces using high-level React components which then automatically connect to the GraphQL API provided by Contember Engine.

Automated data binding from the GraphQL server to React components eliminates the need for manual data fetching or updates, simplifying the process of creating a custom interface.

## Contember Cloud: Managed Hosting Service

If you prefer not to host Contember Engine yourself, Contember Cloud is a managed hosting service that allows you to deploy your projects with ease. It handles tasks related to deployment, scaling, security, and offers professional support, freeing you to focus purely on development.

## A Quick Look at the Contember Workflow

Here's a basic workflow of using Contember:

### 1. Data Model Definition

Define your project's schema, which is then passed to the Contember Engine. Contember Engine then creates a table in a PostgreSQL database, where it stores your data and instantly provides you with GraphQL API. For example, a simple blog schema could look like this:

```typescript
// Post.ts
import { c } from '@contember/schema-definition'

export const publicRole = c.createRole('public')

@c.Allow(publicRole, {
    when: { publishedAt: { gte: 'now' } },
    read: ['content'],
})
export class Post {
  title = c.stringColumn().notNull()
  publishedAt = c.dateTimeColumn()
  content = c.stringColumn().notNull()
}
```
### 2. GraphQL API Generation

Once the schema is defined, the Contember Engine creates a corresponding table in a PostgreSQL database, and a GraphQL API is generated for your use.

To save a post using GraphQL API, just fire this mutation:

```graphql
mutation {
  createPost(
    data: {
      title: "Hello world",
      content: "first article stored in Contember!",
      publishedAt: "2019-12-11T16:35:06"
    }
  ) {
    ok
    errorMessage
    node {
      id
    }
  }
}
```

To list all published posts, you can use this query:

```graphql
query {
  listPost(filter: {publishedAt: {isNull: false}}) {
    title
    publishedAt
  }
}
```

### 3. Data Interactions

You can use GraphQL mutations and queries to interact with your data.

### 4. Building the UI

The Contember Interface enables the creation of custom management interfaces. A post edit page, for example, can be simply created as:

```typescript jsx
export const postEdit = (
    <EditPage entity="Post(id = $id)">
        <TextField field="title" label="Title" />
        <TextAreaField field="content" label="Content" />
        <DateTimeField field="publishedAt" label="Published at" />
    </EditPage>
)
```

With Contember, the process of web application development becomes more efficient and straightforward, allowing developers to focus more on crafting solutions and less on managing infrastructure and setup.

Whether you're using the open-source platform or the managed Contember Cloud, you'll experience accelerated development timelines and a more streamlined workflow.

<DocsCards>
  <DocsCard header="Installation Guide" href="/intro/installation">
    <p>Step-by-step guide to start a new project with Contember.</p>
  </DocsCard>

  <DocsCard header="Starter Kits" href="https://github.com/contember/starter-kits">
    <p>Check out our ready-to-use examples of what you can do with Contember.</p>
  </DocsCard>

  <DocsCard header="Roles and access control" href="/guides/acl-definition">
    <p>Powerful declarative way to control access to your data.</p>
  </DocsCard>

  <DocsCard header="Understand data binding" href="/reference/interface/data-binding/overview">
    <p>Understand how automatic data binding in Contember works.</p>
  </DocsCard>
</DocsCards>

<!--
TODO:
MISSING PROJECTS
PICTURE OF CONTEMBER API SERVER, POSTGRES DB AND MULTIPLE CLIENTS
THE CONTEMBER API SERVER SQUARE CONTAINS SUB-SQUARES = PROJECTS & TENANT API
PROJECTS SUB SQUARE CONTAINS BLOG SUBSQUARE
BLOG SUB SQUARE CONTAINS CONTENT API AND SYSTEM API
POSSIBLE INCLUDE WALL AS AUTHORIZATION LAYER``
-->
