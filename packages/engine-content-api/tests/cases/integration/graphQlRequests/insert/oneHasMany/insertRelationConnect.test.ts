import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('insert category and connect existing post (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasOne('category', r => r.target('Category').inversedBy('posts')),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
          mutation {
              createCategory(data: {name: "Hello world", posts: [{connect: {id: "${testUuid(5)}"}}]}) {
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."category" ("id", "name") select "root_"."id", "root_"."name" from "root_" returning "id"`,
					parameters: [testUuid(1), 'Hello world'],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(5)],
					response: {
						rows: [{ id: testUuid(5) }],
					},
				},
				{
					sql: SQL`with "newdata_" as (select ? :: uuid as "category_id", "root_"."id", "root_"."name" from "public"."post" as "root_" where "root_"."id" = ?)
						update "public"."post" set "category_id" = "newdata_"."category_id" from "newdata_" where "post"."id" = "newdata_"."id"`,
					parameters: [testUuid(1), testUuid(5)],
					response: {
						rowCount: 1,
					},
				},
				{
					sql: SQL`select "root_"."id" as "root_id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
			]),
		],
		return: {
			data: {
				createCategory: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

