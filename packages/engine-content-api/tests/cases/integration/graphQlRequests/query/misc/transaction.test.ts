import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('transactions', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          transaction {
            post1: getPost(by: {id: "${testUuid(1)}"}) {
              id
            }
            posts: listPost {
              id
            }
            postsPaginated: paginatePost {
              pageInfo {
                totalCount
              }
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id"
						         from "public"."post" as "root_"
                     where "root_"."id" = ?`,
					response: { rows: [{ root_id: testUuid(1) }] },
					parameters: [testUuid(1)],
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
						         from "public"."post" as "root_"`,
					response: { rows: [{ root_id: testUuid(2) }] },
					parameters: [],
				},
				{
					sql: SQL`select count(*) as "row_count"
from "public"."post" as "root_"`,
					parameters: [],
					response: { rows: [{ row_count: 10 }] },
				},
			]),
		],
		return: {
			data: {
				transaction: {
					post1: {
						id: testUuid(1),
					},
					posts: [
						{
							id: testUuid(2),
						},
					],
					postsPaginated: {
						pageInfo: {
							totalCount: 10,
						},
					},
				},
			},
		},
	})
})


