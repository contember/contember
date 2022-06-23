import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithLocale } from './schema.js'

test('delete', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{delete: {locale: "cs"}}]}
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
				...sqlDeferred([
					{
						sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
						parameters: ['cs', testUuid(2)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post_locale"
              where "id" in (select "root_"."id"
                             from "public"."post_locale" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
				]),
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

