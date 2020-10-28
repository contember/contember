import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post title contains', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {title: {contains: "Hello%world"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
							select "root_"."id" as "root_id"
							from "public"."post" as "root_"
							where "root_"."title" like '%' || ? || '%'`,
				response: { rows: [{ root_id: testUuid(1) }] },
				parameters: ['Hello\\%world'],
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
test.run()
