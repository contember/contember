import { expect, test } from 'bun:test'
import { c, createSchema } from '../../../src/index.js'
import { Model } from '@contember/schema'

namespace NumericModel {
	export class Product {
		price = c.numericColumn(20, 9).notNull()
		discount = c.numericColumn(5, 2)
	}
}

test('numericColumn produces numeric(precision, scale)', () => {
	const schema = createSchema(NumericModel)
	const fields = schema.model.entities.Product.fields

	expect(fields.price).toMatchObject({
		name: 'price',
		columnName: 'price',
		type: Model.ColumnType.Numeric,
		columnType: 'numeric(20, 9)',
		nullable: false,
	})

	expect(fields.discount).toMatchObject({
		name: 'discount',
		columnName: 'discount',
		type: Model.ColumnType.Numeric,
		columnType: 'numeric(5, 2)',
		nullable: true,
	})
})
