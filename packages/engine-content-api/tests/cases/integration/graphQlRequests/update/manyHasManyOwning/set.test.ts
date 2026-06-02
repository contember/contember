import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithCategories } from './schema'

test('set with default orphanStrategy (disconnect) - junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: {set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=3) is disconnected from the junction
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(2), testUuid(3)],
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

test('set with orphanStrategy delete - junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: {orphanStrategy: delete, set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=3) is deleted
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."category" where "id" in (?)`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
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

test('empty set clears the whole collection - junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: {set: []}}
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
				// no desired members - every junction row is an orphan
				{
					sql: SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=1) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				// orphan (id=3) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(2), testUuid(3)],
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

test('set with a connectOrCreate item (existing target) - junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: {set: [{connectOrCreate: {connect: {id: "${testUuid(1)}"}, create: {name: "Ipsum"}}}]}}
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
				// the set helper resolves the connectOrCreate target up-front to mark it desired
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// connectOrCreate processor resolves the target again and connects it
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				// current members - the connected one plus an orphan (id=3)
				{
					sql: SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`delete from "public"."post_categories"
              where "post_id" = ? and "category_id" = ?`,
					parameters: [testUuid(2), testUuid(3)],
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

test('set with orphanStrategy delete is rejected when delete is ACL-denied - junction', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {categories: {orphanStrategy: delete, set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_" where "junction_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=3): delete is attempted, but the ACL predicate denies it
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."category" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3), allowed: false }] },
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
