import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../src/test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

namespace NumericModel {
	export class Product {
		price = def.numericColumn(20, 9)
	}
}

const schema = createSchema(NumericModel).model

test('insert product with numeric price (cast to numeric(p, s))', async () => {
	await execute({
		schema,
		query: GQL`
        mutation {
          createProduct(data: {price: "123.45"}) {
            node {
              id
              price
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: numeric(20, 9) as "price")
						insert into "public"."product" ("id", "price")
						select "root_"."id", "root_"."price"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), '123.45'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id", "root_"."price"::text as "root_price"
                     from "public"."product" as "root_"
                     where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ root_id: testUuid(1), root_price: '123.450000000' }] },
				},
			]),
		],
		return: {
			data: {
				createProduct: {
					node: {
						id: testUuid(1),
						price: '123.450000000',
					},
				},
			},
		},
	})
})

test('update product numeric price (cast to numeric(p, s))', async () => {
	await execute({
		schema,
		query: GQL`
        mutation {
          updateProduct(by: {id: "${testUuid(1)}"}, data: {price: "999.99"}) {
            node {
              id
              price
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."product" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as
						(select ? :: numeric(20, 9) as "price", "root_"."price" as "price_old__", "root_"."id"
						from "public"."product" as "root_"  where "root_"."id" = ?)
						update "public"."product"
						set "price" = "newData_"."price"  from "newData_"
						where "product"."id" = "newData_"."id"  returning "price_old__"`,
					parameters: ['999.99', testUuid(1)],
					response: { rows: [{ price_old__: '1.000000000' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id", "root_"."price"::text as "root_price"
                     from "public"."product" as "root_"
                     where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ root_id: testUuid(1), root_price: '999.990000000' }] },
				},
			]),
		],
		return: {
			data: {
				updateProduct: {
					node: {
						id: testUuid(1),
						price: '999.990000000',
					},
				},
			},
		},
	})
})
