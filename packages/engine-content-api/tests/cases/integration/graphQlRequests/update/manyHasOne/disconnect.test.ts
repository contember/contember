import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithNullableAuthor } from './schema.js'

test('disconnect', async () => {
	await execute({
		schema: postWithNullableAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {disconnect: true}}
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
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
             where "post"."id" = "newData_"."id"`,
					parameters: [null, testUuid(2)],
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


