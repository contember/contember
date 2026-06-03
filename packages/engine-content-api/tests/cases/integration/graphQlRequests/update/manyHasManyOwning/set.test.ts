import { test } from 'bun:test'
import { Acl } from '@contember/schema'
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

// The orphan-candidate set is fetched through the target entity's ACL read predicate, so a current
// member the role cannot read is invisible to the diff and therefore never orphaned, while a readable
// omitted member is orphaned as usual. This mirrors the oneHasMany behavior.
const restrictedReadPermissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
			},
			update: {
				id: true,
				categories: true,
			},
		},
	},
	Category: {
		predicates: {
			category_read_predicate: {
				name: { eq: 'visible' },
			},
		},
		operations: {
			read: {
				id: 'category_read_predicate',
			},
			update: {
				posts: true,
			},
		},
	},
}

test('set applies the target read predicate when computing orphans - junction', async () => {
	await execute({
		schema: postWithCategories,
		permissions: restrictedReadPermissions,
		variables: {},
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
				// resolving the connect target applies Category's read predicate
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ? and "root_"."name" = ?`,
					parameters: [testUuid(1), 'visible'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rowCount: 1 },
				},
				// orphan-candidate fetch joins the target entity and applies its read predicate, so members
				// the role cannot read are excluded from the diff. Unreadable current members are simply
				// absent from this result and are therefore left untouched.
				{
					sql:
						SQL`select "junction_"."category_id" as "primary_" from "public"."post_categories" as "junction_"
						inner join "public"."category" as "root_" on "junction_"."category_id" = "root_"."id"
						where "junction_"."post_id" = ? and "root_"."name" = ?`,
					parameters: [testUuid(2), 'visible'],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// the readable omitted member (id=3) is disconnected from the junction
				{
					sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ? and "root_"."name" = ?`,
					parameters: [testUuid(3), 'visible'],
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
