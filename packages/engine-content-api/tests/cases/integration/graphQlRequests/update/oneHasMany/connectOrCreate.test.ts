import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithLocale } from './schema'

test('connectOrCreate - exists', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{connectOrCreate: {connect: {id: "${testUuid(10)}"}, create: {title: "World"}}}]}
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
					sql: SQL`select "root_"."id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(10)],
					response: { rows: [{ id: testUuid(10) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: uuid as "post_id", "root_"."post_id" as "post_id_old__", "root_"."id", "root_"."title", "root_"."locale"  from "public"."post_locale" as "root_"  where "root_"."id" = ?) update  "public"."post_locale" set  "post_id" =  "newData_"."post_id"   from "newData_"  where "post_locale"."id" = "newData_"."id"  returning "post_id_old__"`,
					parameters: [testUuid(2), testUuid(10)],
					response: { rows: [{ post_id_old__: testUuid(1) }] },
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
test('upsert - not exists (composed unique)', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{connectOrCreate: {connect: {id: "${testUuid(10)}"}, create: {title: "World"}}}]}
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
					sql: SQL`select "root_"."id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(10)],
					response: { rows: [] },
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "post_id", ? :: text as "locale")
							insert into "public"."post_locale" ("id", "title", "post_id", "locale")
							select "root_"."id", "root_"."title", "root_"."post_id", "root_"."locale"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'World', testUuid(2), null],
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

