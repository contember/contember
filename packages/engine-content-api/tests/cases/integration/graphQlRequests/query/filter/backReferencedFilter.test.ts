import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Categories with children filtered by back-referenced parent', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Category', entity =>
				entity.manyHasOne('parent', r => r.inversedBy('children').target('Category')).column('name'),
			)
			.buildSchema(),
		query: GQL`
        query {
          listCategory {
            id
            children(filter: {parent: {name: {eq: "foo"}}}) {
                id
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."category" as "root_"`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(2),
						},
					],
				},
			},
			{
				sql: SQL`select "root_"."parent_id" as "__grouping_key", "root_"."id" as "root_id"
							from "public"."category" as "root_"
							left join "public"."category" as "root_parent" on "root_"."parent_id" = "root_parent"."id"
							where "root_parent"."name" = ? and "root_parent"."id" in (?, ?)`,
				response: {
					rows: [
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(10),
						},
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(11),
						},
					],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						children: [
							{
								id: testUuid(10),
							},
							{
								id: testUuid(11),
							},
						],
					},
					{
						id: testUuid(2),
						children: [],
					},
				],
			},
		},
	})
})

