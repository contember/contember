import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithLocale } from './schema'

test('delete and create', async () => {
	await execute({
		schema: postWithLocale,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {locales: [{delete: {locale: "cs"}}, {create: {title: "Hello", locale: "cs"}}]}
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
					sql: SQL`select "root_"."id" from "public"."post_locale" as "root_" where "root_"."locale" = ? and "root_"."post_id" = ?`,
					parameters: ['cs', testUuid(2)],
					response: { rows: [{ id: testUuid(9) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."post_locale" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(9)],
					response: { rows: [{ id: testUuid(9), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."post_locale" where "id" in (?)`,
					parameters: [testUuid(9)],
					response: { rows: [{ id: testUuid(9) }] },
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "post_id")
							insert into "public"."post_locale" ("id", "title", "locale", "post_id")
							select "root_"."id", "root_"."title", "root_"."locale", "root_"."post_id"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'Hello', 'cs', testUuid(2)],
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

