import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithAuthor } from './schema.js'

test('create', async () => {
	await execute({
		schema: postWithAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {create: {name: "John"}}}
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
				// 	sql: SQL`select "root_"."author_id" as "root_author", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				// 	parameters: [testUuid(2)],
				// 	response: { rows: [{ root_id: testUuid(2), root_author: null }] },
				// },
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name")
							insert into "public"."author" ("id", "name")
							select "root_"."id", "root_"."name"
							from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: { rows: [{ id: testUuid(1) }] },
				},

				{
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
              where "post"."id" = "newData_"."id"`,
					parameters: [testUuid(1), testUuid(2)],
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

