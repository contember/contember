import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('hashes an alias when too long', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Category', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('subtitle', c => c.type(Model.ColumnType.String))
					.manyHasOne('parent', r => r.target('Category')),
			)
			.buildSchema(),
		query: GQL`
        query {
          listCategory(filter: {or: [
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {title: {eq: "Hello"}}}}}}}}}}}},
	          {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {parent: {subtitle: {eq: "Hello"}}}}}}}}}}},
          ]}) {
            id
            title
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id", "root_"."title" as "root_title"
					from "public"."category" as "root_"
					left join  "public"."category" as "root_parent" on  "root_"."parent_id" = "root_parent"."id"
					left join  "public"."category" as "root_parent_parent" on  "root_parent"."parent_id" = "root_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent" on  "root_parent_parent"."parent_id" = "root_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent" on  "root_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent" on  "root_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent_parent" on  "root_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent_parent_parent" on  "root_parent_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent_parent_parent_parent" on  "root_parent_parent_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent_parent"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent_parent_parent_parent__1" on  "root_parent_parent_parent_parent_parent_parent_parent_parent"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent_parent__1"."id"
					left join  "public"."category" as "root_parent_parent_parent_parent_parent_parent_parent_parent__2" on  "root_parent_parent_parent_parent_parent_parent_parent_parent__1"."parent_id" = "root_parent_parent_parent_parent_parent_parent_parent_parent__2"."id"
					where ("root_parent_parent_parent_parent_parent_parent_parent_parent__2"."title" = ?
						or "root_parent_parent_parent_parent_parent_parent_parent_parent__1"."subtitle" = ?)`,
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

