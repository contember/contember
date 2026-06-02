import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { Model } from '@contember/schema'
import { DefinitionCodeGenerator } from '../../../src/definition-generator/DefinitionCodeGenerator'

namespace NumericModel {
	export class Product {
		price = c.numericColumn(20, 9).notNull()
		discount = c.numericColumn(5, 2)
	}
}

test('reverse codegen round-trips numericColumn(precision, scale)', () => {
	const schema = createSchema(NumericModel)
	const generated = new DefinitionCodeGenerator().generate(schema)

	expect(generated).toContain('price = c.numericColumn(20, 9).notNull()')
	expect(generated).toContain('discount = c.numericColumn(5, 2)')
})

test('reverse codegen parses arbitrary whitespace/casing in numeric(p, s)', () => {
	const schema = createSchema(NumericModel)
	// Mutate the stored columnType to an equivalent-but-unusual form to exercise the regex.
	schema.model.entities.Product.fields.price = {
		...(schema.model.entities.Product.fields.price as Model.AnyColumn),
		columnType: 'NUMERIC ( 30 ,  10 )',
	}

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain('price = c.numericColumn(30, 10).notNull()')
})

test('reverse codegen falls back when columnType is not parseable', () => {
	const schema = createSchema(NumericModel)
	// An unparseable columnType (e.g. a bare "numeric" without precision/scale, or a domain type)
	// must fall back to a default numericColumn(...) plus an explicit columnType(...).
	schema.model.entities.Product.fields.price = {
		...(schema.model.entities.Product.fields.price as Model.AnyColumn),
		columnType: 'my_money_domain',
	}

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain("price = c.numericColumn(30, 10).columnType('my_money_domain').notNull()")
})

test('reverse codegen fallback omits columnType when it equals the default', () => {
	const schema = createSchema(NumericModel)
	// A bare "numeric" is not matched by the precision/scale regex, but equals the default
	// column type, so no redundant columnType(...) should be emitted.
	schema.model.entities.Product.fields.discount = {
		...(schema.model.entities.Product.fields.discount as Model.AnyColumn),
		columnType: 'numeric',
	}

	const generated = new DefinitionCodeGenerator().generate(schema)
	expect(generated).toContain('discount = c.numericColumn(30, 10)')
	expect(generated).not.toContain("columnType('numeric')")
})
