import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post title similar', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {title: {similar: "Hello"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
							select "root_"."id" as "root_id"
							from "public"."post" as "root_"
							where "root_"."title" % ?`,
				response: { rows: [{ root_id: testUuid(1) }] },
				parameters: ['Hello'],
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
					},
				],
			},
		},
	})
})

test('Post title wordSimilar', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {title: {wordSimilar: "Helo"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
							select "root_"."id" as "root_id"
							from "public"."post" as "root_"
							where ? <% "root_"."title"`,
				response: { rows: [{ root_id: testUuid(1) }] },
				parameters: ['Helo'],
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
					},
				],
			},
		},
	})
})
