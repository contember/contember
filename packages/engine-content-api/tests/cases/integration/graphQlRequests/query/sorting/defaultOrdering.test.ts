import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('one has many - default ordering', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Menu', e =>
				e.oneHasMany('items', r =>
					r
						.ownedBy('menu')
						.orderBy('order')
						.target('MenuItem', e => e.column('heading').column('order', c => c.type(Model.ColumnType.Int))),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listMenu {
	          id
	          items {
		          heading
	          }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from  "public"."menu" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "root_"."menu_id" as "__grouping_key", "root_"."heading" as "root_heading", "root_"."id" as "root_id"
from  "public"."menu_item" as "root_"   where "root_"."menu_id" in (?, ?)
order by "root_"."order" asc, "root_"."id" asc`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(11), root_heading: 'a1' },
						{ __grouping_key: testUuid(1), root_id: testUuid(12), root_heading: 'a2' },
						{ __grouping_key: testUuid(2), root_id: testUuid(13), root_heading: 'a3' },
					],
				},
			},
		],
		return: {
			data: {
				listMenu: [
					{
						id: testUuid(1),
						items: [
							{
								heading: 'a1',
							},
							{
								heading: 'a2',
							},
						],
					},
					{
						id: testUuid(2),
						items: [
							{
								heading: 'a3',
							},
						],
					},
				],
			},
		},
	})
})

test('many has many - default ordering', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('categories', relation =>
					relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))).orderBy('name'),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
	          id
	          categories {
		          name
	          }
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from  "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "junction_"."category_id", "junction_"."post_id"
from  "public"."post_categories" as "junction_"
inner join "public"."category" as "root_" on "junction_"."category_id" = "root_"."id"
where "junction_"."post_id" in (?, ?)   order by "root_"."name" asc, "root_"."id" asc`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ post_id: testUuid(1), category_id: testUuid(12) },
						{ post_id: testUuid(1), category_id: testUuid(11) },
						{ post_id: testUuid(2), category_id: testUuid(12) },
					],
				},
			},
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id"
from  "public"."category" as "root_"   where "root_"."id" in (?, ?)`,
				parameters: [testUuid(12), testUuid(11)],
				response: {
					rows: [
						{ root_id: testUuid(11), root_name: 'A' },
						{ root_id: testUuid(12), root_name: 'B' },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						categories: [
							{
								name: 'B',
							},
							{
								name: 'A',
							},
						],
					},
					{
						id: testUuid(2),
						categories: [
							{
								name: 'B',
							},
						],
					},
				],
			},
		},
	})
})

