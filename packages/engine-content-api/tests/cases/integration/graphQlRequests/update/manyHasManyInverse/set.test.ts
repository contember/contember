import { test } from 'bun:test'
import { Acl } from '@contember/schema'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithCategories } from './schema.js'

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

// The orphan-candidate set is fetched through the target entity's ACL read predicate, so a current
// member the role cannot read is invisible to the diff and therefore never orphaned, while a readable
// omitted member is orphaned as usual. This mirrors the oneHasMany behavior, now also on the inverse side.
const restrictedReadPermissions: Acl.Permissions = {
	Post: {
		predicates: {
			post_read_predicate: {
				title: { eq: 'visible' },
			},
		},
		operations: {
			read: {
				id: 'post_read_predicate',
			},
			update: {
				categories: true,
			},
		},
	},
	Category: {
		predicates: {},
		operations: {
			read: {
				id: true,
			},
			update: {
				id: true,
				posts: true,
			},
		},
	},
}

test('set applies the target read predicate when computing orphans - inverse junction', async () => {
	await execute({
		schema: postWithCategories,
		permissions: restrictedReadPermissions,
		variables: {},
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
				// resolving the connect target applies Post's read predicate
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ? and "root_"."title" = ?`,
					parameters: [testUuid(1), 'visible'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into  "public"."post_categories" ("post_id", "category_id") values  (?, ?) on conflict  do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rowCount: 1 },
				},
				// orphan-candidate fetch joins the target entity and applies its read predicate, so members
				// the role cannot read are excluded from the diff and left untouched.
				{
					sql: SQL`select "junction_"."post_id" as "primary_" from "public"."post_categories" as "junction_"
						inner join "public"."post" as "root_" on "junction_"."post_id" = "root_"."id"
						where "junction_"."category_id" = ? and "root_"."title" = ?`,
					parameters: [testUuid(2), 'visible'],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// the readable omitted member (id=3) is disconnected from the junction
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ? and "root_"."title" = ?`,
					parameters: [testUuid(3), 'visible'],
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
