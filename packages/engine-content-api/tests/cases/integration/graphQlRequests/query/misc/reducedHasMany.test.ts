import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('reduced has many', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
					.oneHasMany('locales', r =>
						r.ownedBy('post').target('PostLocale', e =>
							e
								.unique(['locale', 'post'])
								.column('locale', c => c.type(Model.ColumnType.String))
								.column('title', c => c.type(Model.ColumnType.String)),
						),
					),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
	          id
	          localesByLocale(by: {locale: "cs"}) {
		          id
	          }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."id" as "root_id"
                   from "public"."post" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
                     "root_"."post_id" as "root_post",
                     "root_"."id" as "root_id"
                   from "public"."post_locale" as "root_"
                   where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
				parameters: ['cs', testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_post: testUuid(1), root_id: testUuid(11) },
						{ root_post: testUuid(2), root_id: testUuid(12) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						localesByLocale: { id: testUuid(11) },
					},
					{
						id: testUuid(2),
						localesByLocale: { id: testUuid(12) },
					},
				],
			},
		},
	})
})

