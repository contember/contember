import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithAuthor, postWithNullableAuthor } from './schema.js'

test('delete', async () => {
	await execute({
		schema: postWithNullableAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {delete: true}}
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
					sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ author_id: testUuid(1) }],
					},
				},
				...sqlDeferred([
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."author"
              where "id" in (select "root_"."id"
                             from "public"."author" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`
								with "newdata_" as
								(select ? :: uuid as "author_id", "root_"."id"
									from "public"."post" as "root_"
									where "root_"."author_id" in (?))
								update "public"."post" set "author_id" = "newdata_"."author_id"
								from "newdata_"
								where "post"."id" = "newdata_"."id"`,
						parameters: [null, testUuid(1)],
						response: {
							rowCount: 1,
						},
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
test('delete with cascade', async () => {
	await execute({
		schema: postWithAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {delete: true}}
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
					sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ author_id: testUuid(1) }],
					},
				},
				...sqlDeferred([
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."author"
              where "id" in (select "root_"."id"
                             from "public"."author" as "root_"
                             where "root_"."id" = ?)
              returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`
								delete from "public"."post"
								where "id" in
									(select "root_"."id"
									from "public"."post" as "root_"
									where "root_"."author_id" in (?))
								returning "id"`,
						parameters: [testUuid(1)],
						response: {
							rows: [{ id: testUuid(2) }],
						},
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

