import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Format dateTime query with fullDateTimeResponse', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('publishedAt', column => column.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		settings: { content: { fullDateTimeResponse: true } },
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
		executes: [
			{
				sql: SQL`select to_char("root_"."published_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_publishedAt: '2019-11-01T05:00:00.000000Z' }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getPost: {
					publishedAt: '2019-11-01T05:00:00.000000Z',
				},
			},
		},
	})
})

test('Format date query', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('publishedAt', column => column.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."published_at" as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_publishedAt: new Date('2019-11-01T05:00:00.000Z') }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getPost: {
					publishedAt: '2019-11-01T05:00:00.000Z',
				},
			},
		},
	})
})
