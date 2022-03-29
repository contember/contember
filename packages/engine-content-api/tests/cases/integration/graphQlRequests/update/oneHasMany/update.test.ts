import { test } from 'vitest'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithLocale } from './schema'

test('update (composed unique)', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{update: {by: {locale: "cs"}, data: {title: "Hello"}}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`
						with "newData_" as
						(select ? :: text as "title", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set "title" =  "newData_"."title"
						from "newData_"  where "post_locale"."id" = "newData_"."id"`,
					parameters: ['Hello', testUuid(1)],
					response: { rowCount: 1 },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})
test('update (incomplete composed unique)', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{update: {by: {}, data: {title: "Hello"}}}]}
          ) {
          ok
          errors {
             type
             message
          }
        }
      }`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
					errors: [
						{
							type: 'NonUniqueWhereInput',
							message:
								'Provided where is not unique for entity PostLocale:\n' +
								'Provided value: {"post":{"id":"123e4567-e89b-12d3-a456-000000000002"}}\n' +
								'Known unique key combinations:\n' +
								'\t - id\n' +
								'\t - locale, post',
						},
					],
				},
			},
		},
	})
})

