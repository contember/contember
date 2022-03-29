import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithLocale } from './schema'

test('upsert - exists (composed unique)', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {by: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World"}}}]}
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
					sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`
						with "newData_" as
						(select ? :: text as "title", "root_"."id", "root_"."locale", "root_"."post_id"  from "public"."post_locale" as "root_"  where "root_"."id" = ?)
						update  "public"."post_locale" set "title" =  "newData_"."title"
						from "newData_"  where "post_locale"."id" = "newData_"."id"`,
					parameters: ['Hello', testUuid(1)],
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
test('upsert - not exists (composed unique)', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{upsert: {by: {locale: "cs"}, update: {title: "Hello"}, create: {title: "World", locale: "cs"}}}]}
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
					sql: SQL`select "root_"."id"
                       from "public"."post_locale" as "root_"
                       where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: {
						rows: [],
					},
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
							insert into "public"."post_locale" ("id", "title", "locale", "post_id")
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'World', 'cs', testUuid(2)],
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

