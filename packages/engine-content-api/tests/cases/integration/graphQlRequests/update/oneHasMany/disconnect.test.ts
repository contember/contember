import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithNullableLocale } from './schema.js'

test('disconnect', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{disconnect: {id: "${testUuid(1)}"}}]}
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
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`
						with "newData_" as
    					(select ? :: uuid as "post_id", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale"
						set "post_id" =  "newData_"."post_id"
						from "newData_"  where "post_locale"."id" = "newData_"."id"
					`,
					parameters: [null, testUuid(1)],
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

