import { c, createSchema } from '@contember/schema-definition'
import { describe, expect, test } from 'bun:test'
import { emptySchema } from '@contember/schema-utils'
import { SQL } from '../../src/tags.js'
import { testMigrations } from '../../src/tests.js'
import {
	createCheckConstraintModification,
	ModificationHandlerFactory,
	removeCheckConstraintModification,
	SchemaDiffer,
	SchemaMigrator,
	VERSION_LATEST,
} from '../../../src/index.js'

namespace WithoutCheck {
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithCheck {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithChangedCheck {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 10' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithTwoChecks {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	@c.Check({ name: 'discount_below_price', expression: 'discount <= price' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithEmptyChecks {
	@c.ExtendEntity(({ entity }) => ({ ...entity, checks: [] }))
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithCheckOnRemovedField {
	@c.Check({ name: 'discount_below_price', expression: 'discount <= price' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithoutDiscount {
	export class Product {
		price = c.intColumn()
	}
}

namespace WithCheckOnNewColumn {
	@c.Check({ name: 'tax_non_negative', expression: 'tax >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
		tax = c.intColumn()
	}
}

namespace WithDoubleCheck {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0.5' })
	export class Product {
		price = c.doubleColumn()
		discount = c.intColumn()
	}
}

namespace WithReplacedPriceField {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		cost = c.intColumn().columnName('price')
		discount = c.intColumn()
	}
}

namespace WithRenamedPriceColumn {
	@c.Check({ name: 'price_non_negative', expression: 'amount >= 0' })
	export class Product {
		price = c.intColumn().columnName('amount')
		discount = c.intColumn()
	}
}

namespace WithStalePriceColumn {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn().columnName('amount')
		discount = c.intColumn()
	}
}

namespace WithCheckAndCategories {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
		categories = c.oneHasMany(Category, 'product')
	}

	export class Category {
		product = c.manyHasOne(Product, 'categories')
	}
}

namespace WithCheckWithoutCategories {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}

	export class Category {
		name = c.stringColumn()
	}
}

namespace WithCheckAndTax {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
		tax = c.intColumn()
	}
}

namespace WithReorderedChecks {
	@c.Check({ name: 'discount_below_price', expression: 'discount <= price' })
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}
}

namespace WithOffer {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
		discount = c.intColumn()
	}

	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Offer {
		price = c.intColumn()
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

describe('create check constraint', () =>
	testMigrations({
		original: createSchema(WithoutCheck),
		updated: createSchema(WithCheck),
		diff: [
			createCheckConstraintModification.createModification({
				entityName: 'Product',
				check: { name: 'price_non_negative', expression: 'price >= 0' },
			}),
		],
		sql: SQL`ALTER TABLE "product" ADD CONSTRAINT "price_non_negative" CHECK (price >= 0);`,
	}))

describe('remove check constraint', () =>
	testMigrations({
		original: createSchema(WithCheck),
		updated: createSchema(WithoutCheck),
		diff: [
			removeCheckConstraintModification.createModification({
				entityName: 'Product',
				checkName: 'price_non_negative',
			}),
		],
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "price_non_negative";`,
	}))

describe('change check constraint expression', () =>
	testMigrations({
		original: createSchema(WithCheck),
		updated: createSchema(WithChangedCheck),
		diff: [
			removeCheckConstraintModification.createModification({
				entityName: 'Product',
				checkName: 'price_non_negative',
			}),
			createCheckConstraintModification.createModification({
				entityName: 'Product',
				check: { name: 'price_non_negative', expression: 'price >= 10' },
			}),
		],
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "price_non_negative";
		ALTER TABLE "product" ADD CONSTRAINT "price_non_negative" CHECK (price >= 10);`,
	}))

describe('remove one of two check constraints', () =>
	testMigrations({
		original: createSchema(WithTwoChecks),
		updated: createSchema(WithCheck),
		diff: [
			removeCheckConstraintModification.createModification({
				entityName: 'Product',
				checkName: 'discount_below_price',
			}),
		],
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "discount_below_price";`,
	}))

describe('check constraint on a new entity', () => {
	test('is created after the entity columns', () => {
		const diff = differ.diffSchemas(emptySchema, createSchema(WithOffer))
		const ids = diff.map(it => it.modification)
		const lastColumnIndex = ids.lastIndexOf('createColumn')
		const checkIndexes = ids.flatMap((id, i) => id === 'createCheckConstraint' ? [i] : [])
		expect(checkIndexes).toHaveLength(2)
		expect(checkIndexes.every(i => i > lastColumnIndex)).toBe(true)
		for (const modification of diff.filter(it => it.modification === 'createEntity')) {
			expect(modification).not.toHaveProperty('entity.checks')
		}
	})
})

describe('removing an entity with a check constraint', () => {
	test('emits no separate removeCheckConstraint', () => {
		const diff = differ.diffSchemas(createSchema(WithOffer), createSchema(WithCheck))
		expect(diff.map(it => it.modification)).not.toContain('removeCheckConstraint')
		expect(diff.map(it => it.modification)).toContain('removeEntity')
	})
})

describe('reordering check constraints', () => {
	test('produces no diff', () => {
		expect(differ.diffSchemas(createSchema(WithTwoChecks), createSchema(WithReorderedChecks))).toEqual([])
	})
})

const modificationIds = (diff: { modification: string }[]) => diff.map(it => it.modification)

describe('check constraint ordering', () => {
	test('a check is removed before the field it references', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheckOnRemovedField), createSchema(WithoutDiscount)))
		expect(ids).toEqual(['removeCheckConstraint', 'removeField'])
	})

	test('a check is created after the column it references', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithoutCheck), createSchema(WithCheckOnNewColumn)))
		expect(ids).toEqual(['createColumn', 'createCheckConstraint'])
	})

	test('a check is recreated around a column type change', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheck), createSchema(WithDoubleCheck)))
		expect(ids).toEqual(['removeCheckConstraint', 'updateColumnDefinition', 'createCheckConstraint'])
	})
})

describe('empty checks', () => {
	test('the schema definition omits an empty checks list', () => {
		expect(createSchema(WithEmptyChecks).model.entities.Product).not.toHaveProperty('checks')
	})

	test('removing the last check recreates a schema without checks', () => {
		const diff = differ.diffSchemas(createSchema(WithCheck), createSchema(WithEmptyChecks))
		expect(modificationIds(diff)).toEqual(['removeCheckConstraint'])
	})
})

describe('hand-written createEntity with checks', () => {
	test('does not record checks it never creates', () => {
		const migrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
		const product = createSchema(WithCheck).model.entities.Product
		const schema = migrator.applyModifications(emptySchema, [
			{ modification: 'createEntity', entity: { ...product, fields: { id: product.fields.id } } },
		], VERSION_LATEST)
		expect(schema.model.entities.Product).not.toHaveProperty('checks')
	})
})

describe('check constraint failure warnings', () => {
	const factory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schema = createSchema(WithCheck)

	test('removing a field of an entity with checks warns', () => {
		const handler = factory.create('removeField', { entityName: 'Product', fieldName: 'discount' }, schema, { formatVersion: VERSION_LATEST })
		expect(handler.describe({ createdEntities: [] }).failureWarning).toContain('check constraints')
	})

	test('renaming a column of an entity with checks warns', () => {
		const handler = factory.create('updateColumnName', { entityName: 'Product', fieldName: 'price', columnName: 'amount' }, schema, {
			formatVersion: VERSION_LATEST,
		})
		expect(handler.describe({ createdEntities: [] }).failureWarning).toContain('check constraints')
	})

	test('an entity without checks gets no warning', () => {
		const handler = factory.create('removeField', { entityName: 'Product', fieldName: 'discount' }, createSchema(WithoutCheck), {
			formatVersion: VERSION_LATEST,
		})
		expect(handler.describe({ createdEntities: [] }).failureWarning).toBeUndefined()
	})
})

describe('checks of an entity whose columns change', () => {
	test('are recreated when a column is dropped and re-added under the same name', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheck), createSchema(WithReplacedPriceField)))
		expect(ids).toEqual(['removeCheckConstraint', 'removeField', 'createColumn', 'createCheckConstraint'])
	})

	test('are recreated with the updated expression around a column rename', () => {
		const diff = differ.diffSchemas(createSchema(WithCheck), createSchema(WithRenamedPriceColumn))
		expect(diff).toEqual([
			removeCheckConstraintModification.createModification({ entityName: 'Product', checkName: 'price_non_negative' }),
			{ modification: 'updateColumnName', entityName: 'Product', fieldName: 'price', columnName: 'amount' },
			createCheckConstraintModification.createModification({
				entityName: 'Product',
				check: { name: 'price_non_negative', expression: 'amount >= 0' },
			}),
		])
	})

	test('are recreated even with an unchanged expression, so a stale one fails at migration time', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheck), createSchema(WithStalePriceColumn)))
		expect(ids).toEqual(['removeCheckConstraint', 'updateColumnName', 'createCheckConstraint'])
	})

	test('are kept when a field without a column on the table is removed', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheckAndCategories), createSchema(WithCheckWithoutCategories)))
		expect(ids).not.toContain('removeCheckConstraint')
	})

	test('are kept when a column is added', () => {
		const ids = modificationIds(differ.diffSchemas(createSchema(WithCheck), createSchema(WithCheckAndTax)))
		expect(ids).toEqual(['createColumn'])
	})
})
