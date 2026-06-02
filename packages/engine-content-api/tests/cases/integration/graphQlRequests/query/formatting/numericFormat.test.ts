import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Numeric column is selected as text (string transport)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Product', entity => entity.column('price', column => column.type(Model.ColumnType.Numeric)))
			.buildSchema(),
		query: GQL`
        query {
          getProduct(by: {id: "${testUuid(1)}"}) {
            price
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."price"::text as "root_price", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where "root_"."id" = ?`,
				response: { rows: [{ root_id: testUuid(1), root_price: '123.450000000' }] },
				parameters: [testUuid(1)],
			},
		],
		return: {
			data: {
				getProduct: {
					price: '123.450000000',
				},
			},
		},
	})
})

test('Numeric column can be filtered as a number', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Product', entity => entity.column('price', column => column.type(Model.ColumnType.Numeric)))
			.buildSchema(),
		query: GQL`
        query {
          listProduct(filter: {price: {gt: "100.5"}}) {
            price
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."price"::text as "root_price", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where "root_"."price" > ?`,
				response: { rows: [{ root_id: testUuid(1), root_price: '123.450000000' }] },
				parameters: ['100.5'],
			},
		],
		return: {
			data: {
				listProduct: [
					{
						price: '123.450000000',
					},
				],
			},
		},
	})
})
