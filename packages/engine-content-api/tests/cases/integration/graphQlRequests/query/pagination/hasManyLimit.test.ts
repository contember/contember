import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('many has many with where, limit and orderBy', async () => {
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
            posts(filter: {locale: {eq: "cs"}}, orderBy: [{title: asc}], offset: 1, limit: 2) {
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
				sql: SQL`with "data" as
          (select
             "junction_"."category_id",
             "junction_"."post_id",
             row_number()
             over(partition by "junction_"."category_id"
               order by "root_"."title" asc, "root_"."id" asc) as "rowNumber_"
           from "public"."post_categories" as "junction_" inner join "public"."post" as "root_" on "junction_"."post_id" = "root_"."id"
           where "junction_"."category_id" in (?, ?) and "root_"."locale" = ?
           order by "root_"."title" asc, "root_"."id" asc)
          select
            "data".*
          from "data"
          where
            "data"."rowNumber_" > ? and "data"."rowNumber_" <= ?`,
				parameters: [testUuid(1), testUuid(2), 'cs', 1, 3],
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

test('one has many with where, limit and orderBy', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasMany('posts', r =>
						r
							.target('Post', e =>
								e
									.column('title', c => c.type(Model.ColumnType.String))
									.column('locale', c => c.type(Model.ColumnType.String)),
							)
							.ownedBy('author'),
					),
			)
			.buildSchema(),
		query: GQL`
        query {
          listAuthor {
            id
            name
            posts(filter: {locale: {eq: "cs"}}, orderBy: [{title: asc}], offset: 1, limit: 2) {
              id
              title
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name",
                     "root_"."id" as "root_id"
                   from "public"."author" as "root_"`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'John' },
						{ root_id: testUuid(2), root_name: 'Jack' },
					],
				},
			},
			{
				sql: SQL`with "data" as
          (select
             "root_"."author_id" as "__grouping_key",
             "root_"."id" as "root_id",
             "root_"."title" as "root_title",
             row_number()
             over(partition by "root_"."author_id"
               order by "root_"."title" asc, "root_"."id" asc) as "rowNumber_"
           from "public"."post" as "root_"
           where "root_"."locale" = ? and "root_"."author_id" in (?, ?)
           order by "root_"."title" asc, "root_"."id" asc)
          select "data".*
          from "data"
          where "data"."rowNumber_" > ? and "data"."rowNumber_" <= ?`,
				parameters: ['cs', testUuid(1), testUuid(2), 1, 3],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(10), root_title: 'A' },
						{ __grouping_key: testUuid(1), root_id: testUuid(11), root_title: 'B' },
						{ __grouping_key: testUuid(2), root_id: testUuid(12), root_title: 'C' },
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						posts: [
							{
								id: testUuid(10),
								title: 'A',
							},
							{
								id: testUuid(11),
								title: 'B',
							},
						],
						name: 'John',
					},
					{
						id: testUuid(2),
						posts: [
							{
								id: testUuid(12),
								title: 'C',
							},
						],
						name: 'Jack',
					},
				],
			},
		},
	})
})

