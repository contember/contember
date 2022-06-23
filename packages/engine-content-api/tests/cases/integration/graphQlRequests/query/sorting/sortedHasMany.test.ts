import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Post with ordered locales', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('PostLocale', entity => entity.manyHasOne('post', r => r.target('Post', e => e).inversedBy('locales')))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            locales(orderBy: {id: desc}) {
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
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_"
                     where "root_"."post_id" in (?, ?)
                     order by "root_"."id" desc`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(3) },
						{ __grouping_key: testUuid(1), root_id: testUuid(4) },
						{ __grouping_key: testUuid(2), root_id: testUuid(4) },
						{ __grouping_key: testUuid(2), root_id: testUuid(5) },
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
							},
							{
								id: testUuid(4),
							},
						],
					},
					{
						id: testUuid(2),
						locales: [
							{
								id: testUuid(4),
							},
							{
								id: testUuid(5),
							},
						],
					},
				],
			},
		},
	})
})

