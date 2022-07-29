import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Composed filter with nulls', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {or: [null, {and: [null, {title: {eq: "John"}}]}]}) {
            id
          }
        }
			`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id"  from "public"."post" as "root_"   where "root_"."title" = ?`,
				parameters: ['John'],
				response: { rows: [{ root_id: testUuid(1) }] },
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

