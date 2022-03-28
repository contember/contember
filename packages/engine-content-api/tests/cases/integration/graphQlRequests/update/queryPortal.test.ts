import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('query portal', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
			updatePost(by: {id: "${testUuid(1)}"}, data: {title: "Hello"}) {
			  ok
			}
			query {
				posts: listPost {
				  id
				}
			}
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
						         from "public"."post" as "root_"
                     where "root_"."id" = ?`,
					response: { rows: [{ id: testUuid(1) }] },
					parameters: [testUuid(1)],
				},
				{
					sql: SQL`with "newData_" as
    					(select ? :: text as "title", "root_"."id"  from "public"."post" as "root_"  where "root_"."id" = ?)
						update  "public"."post" set  "title" =  "newData_"."title"   from "newData_"  where "post"."id" = "newData_"."id"`,
					parameters: ['Hello', testUuid(1)],
					response: { rowCount: 1 },
				},
			]),
			{
				sql: SQL`select "root_"."id" as "root_id"
							 from "public"."post" as "root_"`,
				response: { rows: [{ root_id: testUuid(2) }] },
				parameters: [],
			},
		],
		return: {
			data: {
				updatePost: {
					ok: true,
				},
				query: {
					posts: [
						{
							id: testUuid(2),
						},
					],
				},
			},
		},
	})
})

test('transaction with query portal', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          transaction {
            updatePost(by: {id: "${testUuid(1)}"}, data: {title: "Hello"}) {
              ok
            }
            query {
				posts: listPost {
				  id
				}
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
						         from "public"."post" as "root_"
                     where "root_"."id" = ?`,
					response: { rows: [{ id: testUuid(1) }] },
					parameters: [testUuid(1)],
				},
				{
					sql: SQL`with "newData_" as
    					(select ? :: text as "title", "root_"."id"  from "public"."post" as "root_"  where "root_"."id" = ?)
						update  "public"."post" set  "title" =  "newData_"."title"   from "newData_"  where "post"."id" = "newData_"."id"`,
					parameters: ['Hello', testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
						         from "public"."post" as "root_"`,
					response: { rows: [{ root_id: testUuid(2) }] },
					parameters: [],
				},
			]),
		],
		return: {
			data: {
				transaction: {
					updatePost: {
						ok: true,
					},
					query: {
						posts: [
							{
								id: testUuid(2),
							},
						],
					},
				},
			},
		},
	})
})


