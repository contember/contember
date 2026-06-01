import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithNullableLocale } from './schema'

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
				// resolve the connect target primary
				{
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// connect: point the target locale to the post
				{
					sql:
						SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ post_id_old__: testUuid(99) }] },
				},
				// fetch current members to compute orphans
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
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
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
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
				// only the desired member is present - no orphans to remove
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }] },
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
				// create a new locale connected to the post
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id") insert into  "public"."post_locale" ("id", "title", "locale", "post_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), 'cs', 'cs', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				// fetch current members - the freshly created one (id=1) plus an existing orphan (id=3)
				{
					sql: SQL`select "root_"."id" as "primary_" from "public"."post_locale" as "root_" where "root_"."post_id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ primary_: testUuid(1) }, { primary_: testUuid(3) }] },
				},
				// orphan (id=3) is disconnected
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
	if (!(error instanceof Error) || !error.message.includes('"set" operation must be the only item')) {
		throw new Error(`Expected a "set must be the only item" error, got: ${String(error)}`)
	}
})
