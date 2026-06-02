import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { Model, Schema } from '@contember/schema'
import { DefinitionCodeGenerator } from '../../../src/definition-generator/DefinitionCodeGenerator'

namespace NumericModel {
	export class Product {
		price = c.numericColumn(20, 9).notNull()
		discount = c.numericColumn(5, 2)
	}
}

// Immutably overrides the stored columnType of a single Product column, so we can
// exercise the regex / fallback branches without writing to the readonly fields map.
const withColumnType = (schema: Schema, field: string, columnType: string): Schema => {
	const entity = schema.model.entities.Product
	const column = entity.fields[field] as Model.AnyColumn
	return {
		...schema,
		model: {
			...schema.model,
			entities: {
				...schema.model.entities,
				Product: {
					...entity,
					fields: {
						...entity.fields,
						[field]: { ...column, columnType },
					},
				},
			},
		},
	}
}

test('reverse codegen round-trips numericColumn(precision, scale)', () => {
	const schema = createSchema(NumericModel)
	const generated = new DefinitionCodeGenerator().generate(schema)

	expect(generated).toContain('price = c.numericColumn(20, 9).notNull()')
	expect(generated).toContain('discount = c.numericColumn(5, 2)')
})

test('reverse codegen parses arbitrary whitespace/casing in numeric(p, s)', () => {
	// An equivalent-but-unusual form must still be parsed by the regex.
	const schema = withColumnType(createSchema(NumericModel), 'price', 'NUMERIC ( 30 ,  10 )')

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain('price = c.numericColumn(30, 10).notNull()')
})

test('reverse codegen falls back when columnType is not parseable', () => {
	// An unparseable columnType (e.g. a domain type) must fall back to a default
	// numericColumn(...) plus an explicit columnType(...).
	const schema = withColumnType(createSchema(NumericModel), 'price', 'my_money_domain')

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain("price = c.numericColumn(30, 10).columnType('my_money_domain').notNull()")
})

test('reverse codegen fallback omits columnType when it equals the default', () => {
	// A bare "numeric" is not matched by the precision/scale regex, but equals the default
	// column type, so no redundant columnType(...) should be emitted.
	const schema = withColumnType(createSchema(NumericModel), 'discount', 'numeric')

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain('discount = c.numericColumn(30, 10)')
	expect(generated).not.toContain("columnType('numeric')")
})
