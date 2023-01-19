import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithNullableAuthor } from './schema'

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
					sql: SQL`with "newData_" as (select ? :: uuid as "author_id", "root_"."author_id" as "author_id_old__", "root_"."id"  from "public"."post" as "root_"  where "root_"."id" = ?) 
							update  "public"."post" set  "author_id" =  "newData_"."author_id"   from "newData_"  where "post"."id" = "newData_"."id"  returning "author_id_old__"`,
					parameters: [null, testUuid(2)],
					response: { rows: [{ author_id_old__: testUuid(99) }] },
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


