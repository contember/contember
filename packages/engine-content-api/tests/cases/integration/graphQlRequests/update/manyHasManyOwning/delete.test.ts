import { test } from 'bun:test'
import { execute, failedTransaction, relationOnlyUpdateLock, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithCategories } from './schema.js'

test('delete', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{delete: {id: "${testUuid(1)}"}}]}
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
				...relationOnlyUpdateLock('post', 'id', testUuid(2)),
				{
					sql: SQL`select "root_"."id" as "id"
						from "public"."category" as "root_"
						inner join "public"."post_categories" as "junction_" on "junction_"."category_id" = "root_"."id"
						where "junction_"."post_id" = ? and "root_"."id" = ?
						for update`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."category" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
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

test('delete - denied', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: [{delete: {id: "${testUuid(1)}"}}]}
          ) {
          ok
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				...relationOnlyUpdateLock('post', 'id', testUuid(2)),
				{
					sql: SQL`select "root_"."id" as "id"
						from "public"."category" as "root_"
						inner join "public"."post_categories" as "junction_" on "junction_"."category_id" = "root_"."id"
						where "junction_"."post_id" = ? and "root_"."id" = ?
						for update`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: false }] },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})
