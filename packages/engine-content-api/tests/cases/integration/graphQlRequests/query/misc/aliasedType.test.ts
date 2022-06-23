import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('aliased type', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String).typeAlias('CategoryName')))
			.buildSchema(),
		query: GQL`
        query($categoryName: CategoryName!) {
          listCategory(filter: {title: {eq: $categoryName}}) {
            id
            title
          }
        }`,
		queryVariables: { categoryName: 'Hello' },
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id", "root_"."title" as "root_title"  from "public"."category" as "root_" where "root_"."title" = ?`,
				parameters: ['Hello'],
				response: {
					rows: [{ root_id: testUuid(1), root_title: 'Hello' }],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						id: testUuid(1),
						title: 'Hello',
					},
				],
			},
		},
	})
})

