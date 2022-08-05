import { test } from 'vitest'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithAuthor, postWithNullableAuthor } from './schema'

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
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: {  },
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
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: {  },
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

test('delete with cascade - denied', async () => {
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
			...failedTransaction([
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
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: false }] },
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

