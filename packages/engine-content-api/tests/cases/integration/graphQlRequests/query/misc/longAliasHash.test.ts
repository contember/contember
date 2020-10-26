import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('hashes an alias when too long', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Category', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).manyHasOne('parent', r => r.target('Category')),
			)
			.buildSchema(),
		query: GQL`
        query {
          listCategory(filter: {or: [
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {title: {eq: "Hello"}}}}}}}}}}}},
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {title: {eq: "Hello"}}}}}}}}}}},
          ]}) {
            id
            title
          }
        }`,
		executes: [
			{
				sql: SQL`SELECT "root_"."id" AS "root_id", "root_"."title" AS "root_title"
						         FROM "public"."category" AS "root_"
							              LEFT JOIN "public"."category" AS "root_parent" ON "root_"."parent_id" = "root_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent" ON "root_parent"."parent_id" = "root_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent"
						         ON "root_parent_parent"."parent_id" = "root_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent"
						         ON "root_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent_parent"
						         ON "root_parent_parent_parent_parent_parent_parent_parent"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent_parent"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent__4b415272"
						         ON "root_parent_parent_parent_parent_parent_parent_parent_parent"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."id"
							              LEFT JOIN "public"."category" AS "root_parent_parent_parent_parent_parent_parent_parent__7f096906"
						         ON "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."parent_id" =
						            "root_parent_parent_parent_parent_parent_parent_parent__7f096906"."id"
						         WHERE ("root_parent_parent_parent_parent_parent_parent_parent__7f096906"."title" = ? OR
						                "root_parent_parent_parent_parent_parent_parent_parent__4b415272"."title" = ?)`,
				parameters: ['Hello', 'Hello'],
				response: {
					rows: [{ root_id: testUuid(1), root_title: 'Hello' }],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						title: 'Hello',
					},
				],
			},
		},
	})
})
test.run()
