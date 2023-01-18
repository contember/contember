import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete post by id', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            node {
              id
              author {
                name
              }
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id",
                      "root_"."author_id" as "root_author"
                     from "public"."post" as "root_"
                   where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [
							{
								root_id: testUuid(1),
								root_author: testUuid(2),
							},
						],
					},
				},
				{
					sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?)`,
					parameters: [testUuid(2)],
					response: {
						rows: [
							{
								root_id: testUuid(2),
								root_name: 'John',
							},
						],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."post" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				deletePost: {
					node: {
						author: {
							name: 'John',
						},
						id: testUuid(1),
					},
				},
			},
		},
	})
})


