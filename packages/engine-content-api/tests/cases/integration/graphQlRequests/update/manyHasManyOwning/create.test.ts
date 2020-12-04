import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithCategories } from './schema'

test('create', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{create: {name: "Lorem"}}]}
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
				// {
				// 	sql: SQL`select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [{ root_id: testUuid(2) }],
				// 	},
				// },
				// {
				// 	sql: SQL`select "junction_"."category_id", "junction_"."post_id" from "public"."post_categories" as "junction_" where "junction_"."post_id" in (?)`,
				// 	parameters: [testUuid(2)],
				// 	response: {
				// 		rows: [],
				// 	},
				// },
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name")
							insert into "public"."category" ("id", "name")
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'Lorem'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
					parameters: [testUuid(2), testUuid(1)],
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
test.run()
