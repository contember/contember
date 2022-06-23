import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { postWithAuthor } from './schema.js'

test('upsert - exists', async () => {
	await execute({
		schema: postWithAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
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
					sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ author_id: testUuid(1) }],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select
                                             ? :: text as "name",
                                             "root_"."id"
                                           from "public"."author" as "root_"
                                           where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
					parameters: ['Jack', testUuid(1)],
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

test('upsert - not exists', async () => {
	await execute({
		schema: postWithAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {upsert: {create: {name: "John"}, update: {name: "Jack"}}}}
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
					sql: SQL`select "root_"."author_id"
                       from "public"."post" as "root_"
                       where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [],
					},
				},
				{
					sql: SQL`with "root_" as
							(select ? :: uuid as "id", ? :: text as "name")
							insert into "public"."author" ("id", "name")
							select "root_"."id", "root_"."name"
              from "root_"
							returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as
              (select
                 ? :: uuid as "author_id",
                 "root_"."id",
                 "root_"."title"
               from "public"."post" as "root_"
               where "root_"."id" = ?) update "public"."post"
              set "author_id" = "newData_"."author_id" from "newData_"
             where "post"."id" = "newData_"."id"`,
					parameters: [testUuid(1), testUuid(2)],
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

