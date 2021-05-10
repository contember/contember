import { test } from 'uvu'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithCategories } from './schema'

test('delete', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				...sqlDeferred([
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
              where "id" in (select "root_"."id"
                             from "public"."post" as "root_"
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
				updateCategory: {
					ok: true,
				},
			},
		},
	})
})
test.run()
