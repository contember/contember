import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { Model } from '@contember/schema'

test('sorts by random', async () => {
	await execute({
		schema: new SchemaBuilder().entity('Post', entity => entity).buildSchema(),
		query: GQL`
        query {
          listPost(orderBy: [{_random: true}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
								select "root_"."id" as "root_id" from "public"."post" as "root_"
								order by random() asc`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})

test('sorts by seeded random', async () => {
	await execute({
		schema: new SchemaBuilder().entity('Post', entity => entity).buildSchema(),
		query: GQL`
        query {
          listPost(orderBy: [{_randomSeeded: 123456}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
								with "rand_seed" as (select setseed(?))
								select "root_"."id" as "root_id" from "public"."post" as "root_"
									inner join "rand_seed" on true
								order by random() asc`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})

test('sorts posts by random on has many relation', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('locale', c => c.type(Model.ColumnType.String))
					.manyHasMany('categories', r =>
						r.target('Category', e => e.column('title', c => c.type(Model.ColumnType.String))).inversedBy('posts'),
					),
			)
			.buildSchema(),
		query: GQL`
        query {
          listCategory {
            id
            title
            posts(orderBy: [{_randomSeeded: 4555}], limit: 1) {
              id
              title
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."category" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Hello' },
						{ root_id: testUuid(2), root_title: 'World' },
					],
				},
			},
			{
				sql: SQL`
							with "data" as
								(with "rand_seed" as
									(select setseed(?))
								select "junction_"."category_id",
									"junction_"."post_id",
									row_number() over(partition by "junction_"."category_id" order by random() asc) as "rownumber_"
								from "public"."post_categories" as "junction_"
									inner join "rand_seed" on true
								where "junction_"."category_id" in (?, ?)
								order by random() asc)
							select "data".* from "data" where "data"."rownumber_" <= ?`,
				parameters: [4555 / Math.pow(2, 31), testUuid(1), testUuid(2), 1],
				response: {
					rows: [
						{ category_id: testUuid(1), post_id: testUuid(10) },
						{ category_id: testUuid(1), post_id: testUuid(11) },
						{ category_id: testUuid(2), post_id: testUuid(10) },
						{ category_id: testUuid(2), post_id: testUuid(12) },
					],
				},
			},
			{
				sql: SQL`select
                     "root_"."title" as "root_title",
                     "root_"."id" as "root_id"
                   from "public"."post" as "root_"
                   where "root_"."id" in (?, ?, ?)`,
				parameters: [testUuid(10), testUuid(11), testUuid(12)],
				response: {
					rows: [
						{ root_id: testUuid(12), root_title: 'A' },
						{ root_id: testUuid(11), root_title: 'B' },
						{ root_id: testUuid(10), root_title: 'C' },
					],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						posts: [
							{
								id: testUuid(10),
								title: 'C',
							},
							{
								id: testUuid(11),
								title: 'B',
							},
						],
						title: 'Hello',
					},
					{
						id: testUuid(2),
						posts: [
							{
								id: testUuid(10),
								title: 'C',
							},
							{
								id: testUuid(12),
								title: 'A',
							},
						],
						title: 'World',
					},
				],
			},
		},
	})
})

