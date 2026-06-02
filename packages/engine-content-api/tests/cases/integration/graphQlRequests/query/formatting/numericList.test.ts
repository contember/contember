import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

namespace NumericListModel {
	export class Product {
		prices = def.numericColumn(20, 9).list()
	}
}

const schema = createSchema(NumericListModel).model

test('Numeric list column is selected as text[] (string array transport)', async () => {
	await execute({
		schema,
		query: GQL`
        query {
          getProduct(by: {id: "${testUuid(1)}"}) {
            prices
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."prices"::text[] as "root_prices", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_prices: ['1.500000000', '2.250000000'] }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getProduct: {
					prices: ['1.500000000', '2.250000000'],
				},
			},
		},
	})
})
