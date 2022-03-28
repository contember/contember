import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithCategories } from './schema'

test('upsert - exists', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {by: {id: "${testUuid(1)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
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
					sql: SQL`with "newData_" as
              (select
                 ? :: text as "title",
                 "root_"."id"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "title" = "newData_"."title" from "newData_"
             where "post"."id" = "newData_"."id"`,
					parameters: ['Lorem', testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: 1,
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
test('upsert - not exists', async () => {
	await execute({
		schema: postWithCategories,
		query: GQL`mutation {
        updateCategory(
            by: {id: "${testUuid(2)}"},
            data: {posts: [{upsert: {by: {id: "${testUuid(1)}"}, update: {title: "Lorem"}, create: {title: "Ipsum"}}}]}
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
					response: { rows: [] },
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "title")
							insert into "public"."post" ("id", "title")
							select "root_"."id", "root_"."title"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'Ipsum'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`insert into "public"."post_categories" ("post_id", "category_id")
              values (?, ?)
              on conflict do nothing`,
					parameters: [testUuid(1), testUuid(2)],
					response: 1,
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

