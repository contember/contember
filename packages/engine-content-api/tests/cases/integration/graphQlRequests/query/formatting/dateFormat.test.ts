import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

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

