import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('insert post with categories (many has many, owning)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e.column('name', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category')),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
          mutation {
              createPost(data: {name: "Hello world", categories: [{create: {name: "Category 1"}}, {create: {name: "Category 2"}}]}) {
                  node {
                      id
                  }
              }
          }
			`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."post" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'Hello world'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(2), 'Category 1'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: 1,
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(3), 'Category 2'],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
          values (?, ?)
          on conflict do nothing`,
					parameters: [testUuid(1), testUuid(3)],
					response: 1,
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				createPost: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

