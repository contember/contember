import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder, SchemaDefinition } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

namespace DateTimeListModel {
	export class Post {
		publishedAt = SchemaDefinition.dateTimeColumn().list()
	}
}

test('Format dateTime query with fullDateTimeResponse (legacy format, default)', async () => {
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
				sql: SQL`select "root_"."published_at"::text as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_publishedAt: '2019-11-01 05:00:00.000000+00' }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getPost: {
					publishedAt: '2019-11-01 05:00:00.000000+00',
				},
			},
		},
	})
})

test('Format dateTime query with fullDateTimeResponse (iso8601 format)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('publishedAt', column => column.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		settings: { content: { fullDateTimeResponse: true, dateTimeResponseFormat: 'iso8601' } },
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
		executes: [
			{
				sql:
					SQL`select to_char("root_"."published_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "root_publishedAt", "root_"."id" as "root_id"
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

test('Format dateTime query with fullDateTimeResponse (iso8601, null value)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('publishedAt', column => column.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		settings: { content: { fullDateTimeResponse: true, dateTimeResponseFormat: 'iso8601' } },
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
		executes: [
			{
				sql:
					SQL`select to_char("root_"."published_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_publishedAt: null }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getPost: {
					publishedAt: null,
				},
			},
		},
	})
})

test('Format dateTime[] query with fullDateTimeResponse (iso8601 list)', async () => {
	await execute({
		schema: SchemaDefinition.createModel(DateTimeListModel),
		settings: { content: { fullDateTimeResponse: true, dateTimeResponseFormat: 'iso8601' } },
		query: GQL`
        query {
          getPost(by: {id: "${testUuid(1)}"}) {
            publishedAt
          }
        }`,
		executes: [
			{
				sql:
					SQL`select (select array_agg(to_char(elem AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') order by ord) from unnest("root_"."published_at") with ordinality as t(elem, ord)) as "root_publishedAt", "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_publishedAt: ['2019-11-01T05:00:00.000000Z', '2020-01-15T08:30:00.000000Z'] }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getPost: {
					publishedAt: ['2019-11-01T05:00:00.000000Z', '2020-01-15T08:30:00.000000Z'],
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
