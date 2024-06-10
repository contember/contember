---
title: View entities
---


View entities in Contember enable developers to map SQL views to the Contember schema, providing a powerful tool for read-only queries. They follow specific rules and are useful in complex data representations.

:::caution
Using views in Contember provides a powerful way to define complex data relationships and aggregations. However, it requires an understanding of SQL, as you'll be writing direct SQL queries to shape the data.
:::

## Use Cases

View entities are particularly useful in scenarios such as:

- **Aggregated Reporting:** Creating summations or averages across multiple tables, e.g., sales reports.
- **Data Transformation:** Displaying data in a transformed or customized manner, e.g., formatting values, processing JSONs
- **Complex Join Operations:** Joining multiple tables in ways that would be cumbersome with traditional Contember entities, e.g., joining sales data with customer information.

## Writing View Entities

### 1. Defining the SQL Query

The first step is to write the SQL query representing the view. Ensure it adheres to the following rules:

- **Emit an `id` value**: Due to Contember's internal requirements, an `id` value must be included in the view. Typically, this is done using `gen_random_uuid() AS id` in the SQL.

- **Field Naming Convention**: When defining fields in the SQL, use underscore_case (e.g., `total_count`). This will map to pascalCase in the Contember schema, ensuring proper correlation. For example, if you define a field as `total_count` in the SQL, you must name it `totalCount` in the entity view definition.

- **Suffix Relations with `_id`**: In the SQL, any relations must be suffixed with `_id`. For instance, if you have a relation named `category` in the view definition, the corresponding SQL must return a column named `category_id`. This convention ensures that relations are accurately mapped and identifiable.


### 2. Creating the View Entity

Use the `@def.View` decorator to wrap the SQL query. Then, define columns and relationships using Contember's standard methods.

:::note
View entities in Contember must hold the owning side of a relationship, so only `oneHasOne` and `manyHasOne` relations are allowed within them. 
:::
Certainly! Here's a revised version that maintains the original structure but rewords the descriptions:

### Example

Suppose you want to gather statistics on survey answers. You can define a view to handle this as follows:

```typescript
@d.View(`
  SELECT
    gen_random_uuid() AS id,
    COUNT(*) as total_count,
    answer_id
  FROM survey_vote
  GROUP BY answer_id
`)
export class SurveyAnswerStats {
  totalCount = d.intColumn().notNull()
  answer = d.oneHasOne(SurveyAnswer, 'stats').notNull()
}
```

This view counts the total number of times each answer has been selected in the surveys.

The Inverse Side of the Relation in the Survey Answer Entity will look like this:

```typescript
export class SurveyAnswer {
  survey = def.manyHasOne(Survey, 'answers').notNull()
  answer = def.stringColumn()
  stats = def.oneHasOneInverse(SurveyAnswerStats, 'answer')
}
```

Here, the `SurveyAnswer` entity includes a reference to the previously defined view, establishing a connection between the answer statistics and the individual survey answers.

#### Querying the Data

Now, the `SurveyAnswerStats` behaves like a standard GraphQL entity, but it's read-only. You can query it with:

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

This query returns all the surveys with their answers and the total count of each answer, leveraging the defined view.

### Handling Dependencies in View Entities

In Contember, if you are defining a view that relies on or selects data from another view, you must specify these dependencies to ensure that migrations are executed in the correct order. You can do this by using the `View` decorator, which takes a second argument with a "dependencies" key. Here, you can enumerate the views that the current view depends on, ensuring proper coordination and execution within your schema.

#### Example: defining dependencies
```typescript
@d.View(`SELECT ....`,
	{
		dependencies: () => [OrderSummary],
	},
)
```

### FAQs

**Q: Can I use any SQL function in the view?**  
**A:** Yes, you can use any SQL function, but ensure that the output matches the defined Contember schema.

**Q: What happens if my mapping is incorrect?**  
**A:** Incorrect mapping between the SQL and the schema fields will result in runtime errors.
