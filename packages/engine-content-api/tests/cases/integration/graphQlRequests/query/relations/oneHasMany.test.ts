import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Posts with locales query (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')))
			.entity('PostLocale', entity =>
				entity
					.column('locale', column => column.type(Model.ColumnType.String))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            locales {
              id
              locale
              title
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: { rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }] },
			},
			{
				sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
						{ root_id: testUuid(4), root_locale: 'en', root_title: 'hello world', __grouping_key: testUuid(1) },
						{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						locales: [
							{
								id: testUuid(3),
								locale: 'cs',
								title: 'ahoj svete',
							},
							{
								id: testUuid(4),
								locale: 'en',
								title: 'hello world',
							},
						],
					},
					{
						id: testUuid(2),
						locales: [
							{
								id: testUuid(5),
								locale: 'cs',
								title: 'dalsi clanek',
							},
						],
					},
				],
			},
		},
	})
})

test('Posts with locales query with where (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')))
			.entity('PostLocale', entity =>
				entity
					.column('locale', column => column.type(Model.ColumnType.String))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            locales(filter: {locale: {eq: "cs"}}) {
              id
              locale
              title
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
				parameters: ['cs', testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
						{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						locales: [
							{
								id: testUuid(3),
								locale: 'cs',
								title: 'ahoj svete',
							},
						],
					},
					{
						id: testUuid(2),
						locales: [
							{
								id: testUuid(5),
								locale: 'cs',
								title: 'dalsi clanek',
							},
						],
					},
				],
			},
		},
	})
})

test.run()
