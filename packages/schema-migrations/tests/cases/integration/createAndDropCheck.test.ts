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
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT "price_non_negative";`,
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
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT "price_non_negative";
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
		sql: SQL`ALTER TABLE "product" DROP CONSTRAINT "discount_below_price";`,
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
