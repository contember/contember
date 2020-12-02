import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Posts with categories and its cz locale (many has many owner + one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.enum('locale', ['cs', 'en'])
			.entity('Post', entity => entity.manyHasMany('categories', relation => relation.target('Category')))
			.entity('Category', entity =>
				entity
					.column('visible', c => c.type(Model.ColumnType.Bool))
					.oneHasMany('locales', relation => relation.target('CategoryLocale')),
			)
			.entity('CategoryLocale', entity =>
				entity
					.column('name', column => column.type(Model.ColumnType.String))
					.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' })),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            categories {
              id
              visible
              locales(filter: {locale: {eq: cs}}) {
                id
                name
              }
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
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
				sql: SQL`select
                       "junction_"."category_id",
                       "junction_"."post_id"
                     from "public"."post_categories" as "junction_"
                     where "junction_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{
							category_id: testUuid(3),
							post_id: testUuid(1),
						},
						{
							category_id: testUuid(4),
							post_id: testUuid(1),
						},
						{
							category_id: testUuid(5),
							post_id: testUuid(2),
						},
						{
							category_id: testUuid(3),
							post_id: testUuid(2),
						},
					],
				},
			},
			{
				sql: SQL`select
                       "root_"."visible" as "root_visible",
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."category" as "root_"
                     where "root_"."id" in (?, ?, ?)`,
				parameters: [testUuid(3), testUuid(4), testUuid(5)],
				response: {
					rows: [
						{
							root_id: testUuid(3),
							root_visible: true,
						},
						{
							root_id: testUuid(4),
							root_visible: true,
						},
						{
							root_id: testUuid(5),
							root_visible: true,
						},
					],
				},
			},
			{
				sql: SQL`
              select
                "root_"."category_id" as "__grouping_key",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "public"."category_locale" as "root_"
              where "root_"."locale" = ? and "root_"."category_id" in (?, ?, ?)
						`,
				parameters: ['cs', testUuid(3), testUuid(4), testUuid(5)],
				response: {
					rows: [
						{
							root_id: testUuid(6),
							root_name: 'Kategorie 1',
							__grouping_key: testUuid(3),
						},
						{
							root_id: testUuid(7),
							root_name: 'Kategorie 2',
							__grouping_key: testUuid(4),
						},
						{
							root_id: testUuid(8),
							root_name: 'Kategorie 3',
							__grouping_key: testUuid(5),
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						categories: [
							{
								id: testUuid(3),
								visible: true,
								locales: [
									{
										id: testUuid(6),
										name: 'Kategorie 1',
									},
								],
							},
							{
								id: testUuid(4),
								visible: true,
								locales: [
									{
										id: testUuid(7),
										name: 'Kategorie 2',
									},
								],
							},
						],
						id: testUuid(1),
					},
					{
						categories: [
							{
								id: testUuid(5),
								visible: true,
								locales: [
									{
										id: testUuid(8),
										name: 'Kategorie 3',
									},
								],
							},
							{
								id: testUuid(3),
								visible: true,
								locales: [
									{
										id: testUuid(6),
										name: 'Kategorie 1',
									},
								],
							},
						],
						id: testUuid(2),
					},
				],
			},
		},
	})
})

test('Categories with posts and author (many has many inverse + many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts'))
					.manyHasOne('author', relation => relation.target('Author')),
			)
			.entity('Category', entity => entity)
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listCategory {
            id
            posts {
              id
              author {
                name
              }
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
				sql: SQL`select
                       "junction_"."category_id",
                       "junction_"."post_id"
                     from "public"."post_categories" as "junction_"
                     where "junction_"."category_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{
							category_id: testUuid(1),
							post_id: testUuid(3),
						},
						{
							category_id: testUuid(1),
							post_id: testUuid(4),
						},
						{
							category_id: testUuid(2),
							post_id: testUuid(4),
						},
						{
							category_id: testUuid(2),
							post_id: testUuid(5),
						},
					],
				},
			},
			{
				sql: SQL`select
                       "root_"."author_id" as "root_author",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" in (?, ?, ?)
						`,
				parameters: [testUuid(3), testUuid(4), testUuid(5)],
				response: {
					rows: [
						{
							root_id: testUuid(3),
							root_author: testUuid(6),
						},
						{
							root_id: testUuid(4),
							root_author: testUuid(7),
						},
						{
							root_id: testUuid(5),
							root_author: testUuid(7),
						},
					],
				},
			},
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?, ?)
						`,
				parameters: [testUuid(6), testUuid(7)],
				response: {
					rows: [
						{
							root_id: testUuid(6),
							root_name: 'John',
						},
						{
							root_id: testUuid(7),
							root_name: 'Jack',
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
						posts: [
							{
								author: {
									name: 'John',
								},
								id: testUuid(3),
							},
							{
								author: {
									name: 'Jack',
								},
								id: testUuid(4),
							},
						],
					},
					{
						id: testUuid(2),
						posts: [
							{
								author: {
									name: 'Jack',
								},
								id: testUuid(4),
							},
							{
								author: {
									name: 'Jack',
								},
								id: testUuid(5),
							},
						],
					},
				],
			},
		},
	})
})
test.run()
