import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithLocale, postWithNullableLocale } from './schema.js'

test('set with default orphanStrategy (disconnect)', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{connect: {id: "${testUuid(1)}"}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// resolve the connect target primary
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// orphan (id=3) is disconnected: resolve it
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				// orphan (id=3) disconnected: set post_id to null
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// connect: point the target locale to the post
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(99) }] },
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

test('set with orphanStrategy delete', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {orphanStrategy: delete, set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// orphan (id=3) is deleted
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."post_locale" where "id" in (?)`,
					parameters: [testUuid(3)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(99) }] },
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

test('set without orphans (collection already matches)', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{connect: {id: "${testUuid(1)}"}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(99) }] },
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

test('set with a create item and an orphan disconnect', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{create: {locale: "cs", title: "cs"}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// phase 2: a `create` item names no existing member, so both are orphans and go first
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// phase 3: only now is the new locale inserted
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id") insert into  "public"."post_locale" ("id", "title", "locale", "post_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), 'cs', 'cs', testUuid(2)],
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

test('set must be the only item', async () => {
	let error: unknown
	try {
		await execute({
			schema: postWithNullableLocale,
			query: GQL`mutation {
          updatePost(
              by: {id: "${testUuid(2)}"},
              data: {locales: [{set: [{connect: {id: "${testUuid(1)}"}}]}, {connect: {id: "${testUuid(3)}"}}]}
            ) {
            ok
          }
        }`,
			executes: [
				...sqlTransaction([]),
			],
			return: {},
		})
	} catch (e) {
		error = e
	}
	if (!(error instanceof Error) || !error.message.includes('"set" operation must be the only item')) {
		throw new Error(`Expected a "set must be the only item" error, got: ${String(error)}`)
	}
})

test('set with an update item (updates an existing member, no orphans)', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{update: {by: {id: "${testUuid(1)}"}, data: {title: "Hello"}}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }] },
				},
				// phase 1 resolves the update target scoped to the owner, so a partial composite
				// unique key would work here just as it does for a plain per-item update
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// no orphans - the only member is the one the input names
				// phase 3: the update processor resolves it again, then updates
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "title" =  "newData_"."title"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "title_old__"`,
					parameters: ['Hello', testUuid(1)],
					response: { rows: [{ title_old__: 'Hi' }] },
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

test('set with a connectOrCreate item (existing target) and an orphan disconnect', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{connectOrCreate: {connect: {id: "${testUuid(1)}"}, create: {locale: "cs", title: "cs"}}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// the set helper resolves the connectOrCreate target up-front to mark it desired
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// connectOrCreate processor resolves the target again, finds it, and connects it
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(99) }] },
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

test('set with an upsert item that creates (target does not exist)', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{upsert: {by: {id: "${testUuid(1)}"}, update: {title: "upd"}, create: {locale: "cs", title: "cs"}}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(3) }] },
				},
				// phase 1 resolves the upsert target within the collection - it is not there
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [] },
				},
				// phase 2: the member the input does not name is disconnected first
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// phase 3: the upsert processor tries the update first, scoped to the owner - not found
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [] },
				},
				// falls back to insert
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id") insert into  "public"."post_locale" ("id", "title", "locale", "post_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), 'cs', 'cs', testUuid(2)],
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

test('set with orphanStrategy delete is rejected when delete is ACL-denied', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {orphanStrategy: delete, set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// orphan (id=3): delete is attempted, but the ACL predicate denies it
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
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

test('empty set clears the whole collection (disconnect)', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: []}}
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
				// no desired members - every current member is an orphan
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=1) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// orphan (id=3) disconnected
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
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

// An upsert whose `by` names a record outside the collection falls back to an insert. Phase 1
// resolves `by` within the collection, so it marks nothing, and the record the insert creates
// cannot be an orphan - it did not exist when the snapshot was taken.
test('set with an upsert item whose "by" matches a record outside the collection', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{upsert: {by: {id: "${testUuid(10)}"}, update: {title: "upd"}, create: {locale: "cs", title: "cs"}}}]}}
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
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(3) }] },
				},
				// phase 1 resolves `by` within the collection - not there, so nothing is marked
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(10), testUuid(2)],
					response: { rows: [] },
				},
				// phase 2: only the pre-existing member (id=3) is orphaned
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [null, testUuid(3)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
				},
				// phase 3: the upsert processor tries its own scoped update first - not found
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(10), testUuid(2)],
					response: { rows: [] },
				},
				// falls back to insert; the new record survives the operation
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id") insert into  "public"."post_locale" ("id", "title", "locale", "post_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), 'cs', 'cs', testUuid(2)],
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

// The relation input type exposes `alias` next to `set`, so it must be accepted (and ignored)
// rather than rejected as an unexpected key.
test('set accepts an alias on the relation input', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {alias: "myAlias", set: [{connect: {id: "${testUuid(1)}"}}]}}
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
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(2) }] },
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

// A not-null owning relation has nowhere to put the null, so the default `disconnect` strategy
// cannot remove an orphan. The engine reports it instead of emitting a doomed UPDATE.
test('set with the default orphanStrategy fails on a not-null owning relation', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{connect: {id: "${testUuid(1)}"}}]}}
          ) {
          ok
          errors {
            type
          }
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				// snapshot the members up front - orphans are members from *before* the operation
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// orphan (id=3): resolved, but there is no way to detach it
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ? and "root_"."post_id" = ?`,
					parameters: [testUuid(3), testUuid(2)],
					response: { rows: [{ id: testUuid(3) }] },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: false,
					errors: [{ type: 'NotNullConstraintViolation' }],
				},
			},
		},
	})
})

// Nullable GraphQL variables mean an operation key can arrive as an explicit null. The per-item
// path strips those before dispatching; `set` items have to behave the same, or the null key
// picks its branch and the mutation dies with an internal error.
test('set strips null-valued operation keys from an item', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{connect: null, create: {locale: "cs", title: "cs"}}]}}
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
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [] },
				},
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id") insert into  "public"."post_locale" ("id", "title", "locale", "post_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), 'cs', 'cs', testUuid(2)],
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

// `set: null` is schema-valid (the field is a nullable list). It must be treated as "not provided",
// like every other null in a relation input, rather than routed into the set path.
test('set: null is treated as no operation', async () => {
	let error: unknown
	try {
		await execute({
			schema: postWithNullableLocale,
			query: GQL`mutation {
          updatePost(
              by: {id: "${testUuid(2)}"},
              data: {locales: {set: null}}
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
				]),
			],
			return: {},
		})
	} catch (e) {
		error = e
	}
	if (!(error instanceof Error) || !error.message.includes('Expected exactly one of')) {
		throw new Error(`Expected a user error about a missing operation, got: ${String(error)}`)
	}
})

// The owner scope is what lets a partial composite unique key address a member, so phase 1 has to
// resolve `update.by` the same way the processor does - a global lookup would reject `{locale}`
// as non-unique on an entity whose unique key is (locale, post).
test('set resolves a partial composite unique `by` within the collection', async () => {
	await execute({
		schema: postWithNullableLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: {set: [{update: {by: {locale: "cs"}, data: {title: "Hello"}}}]}}
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
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }] },
				},
				// phase 1: `{locale: "cs"}` alone is only unique once the owner completes it
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// phase 3: the update processor resolves it again, then updates
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql:
						SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "title" =  "newData_"."title"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "title_old__"`,
					parameters: ['Hello', testUuid(1)],
					response: { rows: [{ title_old__: 'Hi' }] },
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
