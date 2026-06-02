import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

namespace NumericFilterModel {
	export class Product {
		price = def.numericColumn(20, 9)
	}
}

const schema = createSchema(NumericFilterModel).model

test('Numeric column "in" filter renders an IN list', async () => {
	await execute({
		schema,
		query: GQL`
        query {
          listProduct(filter: {price: {in: ["100.5", "200.25"]}}) {
            price
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."price"::text as "root_price", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where "root_"."price" in (?, ?)`,
				parameters: ['100.5', '200.25'],
				response: { rows: [{ root_id: testUuid(1), root_price: '100.500000000' }] },
			},
		],
		return: {
			data: {
				listProduct: [{ price: '100.500000000' }],
			},
		},
	})
})

test('Numeric column "notIn" filter renders a negated IN list', async () => {
	await execute({
		schema,
		query: GQL`
        query {
          listProduct(filter: {price: {notIn: ["100.5", "200.25"]}}) {
            price
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."price"::text as "root_price", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where not("root_"."price" in (?, ?))`,
				parameters: ['100.5', '200.25'],
				response: { rows: [{ root_id: testUuid(1), root_price: '1.000000000' }] },
			},
		],
		return: {
			data: {
				listProduct: [{ price: '1.000000000' }],
			},
		},
	})
})

test('Numeric column "in" filter with >100 values uses the any(?::numeric(p,s)[]) fast path', async () => {
	const values = Array.from({ length: 101 }, (_, i) => String(i))
	await execute({
		schema,
		query: GQL`
        query {
          listProduct(filter: {price: {in: ${JSON.stringify(values)}}}) {
            price
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."price"::text as "root_price", "root_"."id" as "root_id"
                     from "public"."product" as "root_"
                     where "root_"."price" = any(?::numeric(20, 9)[])`,
				parameters: [values],
				response: { rows: [{ root_id: testUuid(1), root_price: '1.000000000' }] },
			},
		],
		return: {
			data: {
				listProduct: [{ price: '1.000000000' }],
			},
		},
	})
})
