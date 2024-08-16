---
title: Glossary
---

## Basics

| Term                          | Definition                                                                                                                                                                                                                         |
| ----------------------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Contember | An open-source developer platform designed to help developers create web applications quickly and efficiently.                                                                                                                     |
| Interface | In the context of Contember, this refers to the user interface components used to build bespoke user interfaces for web applications.                                                                                              |
| Engine | The part of Contember that handles the backend functionalities, including the data model and the GraphQL API.                                                                                                                      |
| Contember Cloud | A managed hosting service offered by Contember. It handles deployment-related tasks such as scaling and security, and provides professional support.                                                                               |
| Project | Every project contains Contember Schema definition for your simple website, blog or any other content-based platform or database. Optionally any project can have its [Contember Interface](/reference/interface/introduction.md). |
| Instance | A running Contember Engine server hosting as many Contember projects as you like (and providing their Content API). Each instance has a single Tenant API, so you can store and manage access from a single point.                 |
| Entity | Entity is a basic unit in model schema. Each entity can have fields.                                                                                                                                                               |
| ACL rules | Access control rules for some entity.                                                                                                                                                                                              |

## Advanced

| Term                                                           | Definition                                                                                                                                   |
|----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Workspace                                                      | Your (git) repository with one or more Contember projects.                                                                                   |
| [Content API](/reference/engine/content/overview.md)           | This is the primary GraphQL API for your project, which is automatically generated from your schema definition.                              |
| System API                                                     | This is a supplementary API for your project. It's primarily used to manage schema migrations. You need it only in really advanced usecases. |
| [Tenant API](/reference/engine/tenant/overview.md)             | This API allows you to manage users, API keys, and project memberships on an instance.                                                       |
| [Project Schema](/reference/engine/schema/overview.md)         | This is the definition of your model, ACL rules, and input validation rules.                                                                 |
| [Project Migrations](/reference/engine/migrations/overview.md) | These are chronologically sorted, files that contain all schema or content changes. They serve as the source of truth for a schema.          |
| Event                                                          | Every operation performed on your data is stored in an event log. This log can be utilized to track history.                                 |
| Superadmin                                                     | This is a special user role within Contember. The Superadmin has the highest level of system access and control.                             |

<!--
ADD MODEL SCHEMA, INPUT VALIDATION RULES
-->
