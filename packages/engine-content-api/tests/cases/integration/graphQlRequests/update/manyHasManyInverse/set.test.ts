import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithCategories } from './schema'

test('set with default orphanStrategy (disconnect) - inverse junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: {set: [{connect: {id: "${testUuid(1)}"}}]}}
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
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "junction_"."post_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."category_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rowCount: 1 },
				},
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

test('empty set clears the whole collection - inverse junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: {set: []}}
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
				// no desired members - every junction row keyed by this category is an orphan
				{
					sql: SQL`select "junction_"."post_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."category_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=1) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rowCount: 1 },
				},
				// orphan (id=3) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rowCount: 1 },
				},
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
