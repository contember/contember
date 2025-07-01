---
title: View entities
---

View entities in Contember enable developers to map SQL views to the Contember schema, providing a powerful tool for **read-only queries**. They are useful for representing complex, computed, or aggregated data that doesn't naturally fit into standard entity models.

:::caution
Using views in Contember provides a powerful way to define complex data relationships and aggregations. However, it requires an understanding of SQL, as you'll be writing direct SQL queries to shape the data.
:::

## Use Cases

View entities are particularly useful in scenarios such as:

- **Aggregated Reporting:** Creating summations or averages across multiple tables (e.g., sales reports).
- **Data Transformation:** Displaying data in a transformed or customized format (e.g., JSON parsing or formatting).
- **Complex Joins:** Performing joins across multiple tables that would be cumbersome to model directly in Contember entities.
- **Cross-schema Integration:** Referencing shared data such as system-wide logs or configuration that lives outside the project schema.

## Writing View Entities

### 1. Defining the SQL Query

When writing the SQL query for a view, follow these rules:

- **Emit an `id` column**: Every view must return an `id`. If your underlying data doesn't have a natural UUID, use a generated one: `gen_random_uuid() AS id`.

- **Use `underscore_case` in SQL**: Column names like `total_count` will map to `camelCase` (`totalCount`) in the Contember schema.

- **Suffix foreign keys with `_id`**: For example, a `category_id` column in SQL maps to a `category` relation in the view entity.

- **Use predefined schema variables**:
  Contember provides the following runtime variables to dynamically scope SQL queries:

  - `{{system_schema}}`: Refers to the system schema containing project system tables such as `actions_event`, `event_data`, `migrations`, etc.
  - `{{project_slug}}`: Refers to the slug of the currently selected project, useful for filtering data like memberships or settings.

### 2. Creating the View Entity

Use the `@c.View` decorator to register the SQL string and define the associated fields using Contember's standard column and relation methods.

:::note
View entities must hold the **owning side** of relationships. This means you can only use `oneHasOne` or `manyHasOne` relations within view entities.
:::

---

## Examples

### Example 1: Using `{{system_schema}}` – Pending Action Events

Accessing unresolved system action events from the shared system schema:

```ts
@c.View(`
SELECT
  null AS id,
  ae.target AS target,
  ae.trigger AS trigger,
  ae.state AS state,
  ae.visible_at AS visible_at
FROM {{system_schema}}.actions_event ae
WHERE ae.resolved_at IS NULL
ORDER BY ae.visible_at ASC
`)
export class PendingActionEvents {
  target = c.stringColumn().notNull()
  trigger = c.stringColumn().notNull()
  state = c.stringColumn().notNull()
  visibleAt = c.dateTimeColumn().notNull()
}
````

This view surfaces pending action events queued in the system.

---

### Example 2: Using `{{project_slug}}` – Project-Specific Memberships

List emails and roles of users assigned to the current project:

```ts
@c.View(`
SELECT
  null AS id,
  p.email AS user_email,
  pm.role AS user_role
FROM tenant.project_membership pm
JOIN tenant.person p ON p.identity_id = pm.identity_id
JOIN tenant.project pr ON pr.id = pm.project_id
WHERE pr.slug = {{project_slug}}
`)
export class ProjectUserRoles {
  userEmail = c.stringColumn().notNull()
  userRole = c.stringColumn().notNull()
}
```

This is ideal for access control dashboards or auditing.

---

### Example 3: Aggregation – Survey Answer Stats

This view counts how many times each survey answer was selected:

```ts
@c.View(`
  SELECT
    null AS id,
    COUNT(*) as total_count,
    answer_id
  FROM survey_vote
  GROUP BY answer_id
`)
export class SurveyAnswerStats {
  totalCount = c.intColumn().notNull()
  answer = c.oneHasOne(SurveyAnswer, 'stats').notNull()
}
```

And the inverse relation in the base entity:

```ts
export class SurveyAnswer {
  survey = c.manyHasOne(Survey, 'answers').notNull()
  answer = c.stringColumn()
  stats = c.oneHasOneInverse(SurveyAnswerStats, 'answer')
}
```

---

### Querying the Data

View entities behave like read-only GraphQL entities. For example:

```graphql
query {
  listSurvey {
    answers {
      answer
      stats {
        totalCount
      }
    }
  }
}
```

---

### Handling Dependencies in View Entities

If a view depends on other views, declare them using the `dependencies` option to ensure the correct migration order.

```ts
@c.View(`SELECT ...`, {
  dependencies: () => [OtherViewEntity],
})
```

---

## FAQs

**Q: Can I use any SQL function in the view?**
**A:** Yes — as long as the resulting columns map to valid Contember fields.

**Q: What happens if my mapping is incorrect?**
**A:** You'll encounter runtime validation errors during migration or startup.

**Q: Can I query across schemas?**
**A:** Yes. Use `{{system_schema}}` to access shared system data and `{{project_slug}}` to scope queries to the current project.
