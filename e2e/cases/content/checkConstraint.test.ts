import { c, createSchema } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '@contember/schema-migrations'
import { createTester, gql } from '../../src/tester.js'

namespace CheckModel {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		code = c.stringColumn().unique().notNull()
		price = c.intColumn().notNull()
	}
}

namespace CheckModelUpdated {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 10' })
	export class Product {
		code = c.stringColumn().unique().notNull()
		price = c.intColumn().notNull()
	}
}

namespace CheckModelRemoved {
	export class Product {
		code = c.stringColumn().unique().notNull()
		price = c.intColumn().notNull()
	}
}

namespace CheckModelReplacedField {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		code = c.stringColumn().unique().notNull()
		cost = c.intColumn().columnName('price')
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

const violationMessage =
	'Execution has failed:\nunknown field: CheckConstraintViolation (Check constraint "price_non_negative" on entity Product violated)'

test('check constraint rejects a violating create and update', async () => {
	const tester = await createTester(createSchema(CheckModel))

	await tester(gql`mutation {
		createProduct(data: {code: "a", price: 5}) {
			ok
		}
	}`)
		.expect(200)
		.expect({ data: { createProduct: { ok: true } } })

	await tester(gql`mutation {
		createProduct(data: {code: "b", price: -1}) {
			ok
			errorMessage
			errors {
				type
			}
		}
	}`)
		.expect(200)
		.expect({
			data: {
				createProduct: {
					ok: false,
					errorMessage: violationMessage,
					errors: [{ type: 'CheckConstraintViolation' }],
				},
			},
		})

	await tester(gql`mutation {
		updateProduct(by: {code: "a"}, data: {price: -1}) {
			ok
			errorMessage
		}
	}`)
		.expect(200)
		.expect({ data: { updateProduct: { ok: false, errorMessage: violationMessage } } })
})

test('changing and removing a check constraint migrates the database', async () => {
	const original = createSchema(CheckModel)
	const updated = createSchema(CheckModelUpdated)
	const removed = createSchema(CheckModelRemoved)
	const tester = await createTester(original)

	await tester.migrate(differ.diffSchemas(original, updated), '2024-08-01-120000-update-check')

	await tester(gql`mutation {
		createProduct(data: {code: "a", price: 5}) {
			ok
			errorMessage
		}
	}`)
		.expect(200)
		.expect({ data: { createProduct: { ok: false, errorMessage: violationMessage } } })

	await tester.migrate(differ.diffSchemas(updated, removed), '2024-08-02-120000-remove-check')

	await tester(gql`mutation {
		createProduct(data: {code: "a", price: -5}) {
			ok
		}
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createProduct.ok).toBe(true)
		})
})

test('a check survives its column being dropped and re-added in one migration', async () => {
	const original = createSchema(CheckModel)
	const updated = createSchema(CheckModelReplacedField)
	const tester = await createTester(original)

	await tester.migrate(differ.diffSchemas(original, updated), '2024-08-01-120000-replace-field')

	await tester(gql`mutation {
		createProduct(data: {code: "a", cost: -1}) {
			ok
			errorMessage
		}
	}`)
		.expect(200)
		.expect({ data: { createProduct: { ok: false, errorMessage: violationMessage } } })
})
