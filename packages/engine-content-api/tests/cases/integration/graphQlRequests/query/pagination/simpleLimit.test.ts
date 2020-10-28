import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('root limit and order', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listAuthor(orderBy: [{name: asc}], offset: 2, limit: 3) {
            id
            name
          }
        }`,
		executes: [
			{
				sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name"
                   from "public"."author" as "root_"
                   order by "root_"."name" asc, "root_"."id" asc
                   limit 3
                   offset 2`,
				parameters: [],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'John' },
						{ root_id: testUuid(2), root_name: 'Jack' },
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						name: 'John',
					},
					{
						id: testUuid(2),
						name: 'Jack',
					},
				],
			},
		},
	})
})
test.run()
