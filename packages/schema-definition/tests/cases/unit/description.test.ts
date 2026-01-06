import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '../../../src'

namespace DescriptionModel {
	@c.Description('Entity1 description')
	export class Entity1 {
		title = c.stringColumn()
		entities2 = c.oneHasMany(Entity2, 'entity1').description('One has many description')
		entity3 = c.oneHasOne(Entity3).description('One has one description')
	}

	export class Entity2 {
		title = c.stringColumn().description('Title description')
		entity1 = c.manyHasOne(Entity1, 'entities2').description('Many has one description')
		entities5 = c.manyHasMany(Entity5).description('Many has many description')
	}

	export class Entity3 {
		title = c.stringColumn()
		entity1 = c.oneHasOneInverse(Entity1, 'entity3').description('One has one inverse description')
	}

	export class Entity4 {
		order = c.intColumn()
		title = c.stringColumn().description('Title description')
		entities5 = c.manyHasManyInverse(Entity5, 'entities4').description('Many has many inverse description')
	}

	export class Entity5 {
		name = c.stringColumn()
		entities2 = c.manyHasManyInverse(Entity2, 'entities5')
		entities4 = c.manyHasMany(Entity4).description('Many has many without inverse')
	}
}

describe('description', () => {

	test('entity description', () => {
		const schema = createSchema(DescriptionModel)

		expect(schema.model.entities.Entity1.description).toBe('Entity1 description')
		expect(schema.model.entities.Entity2.description).toBeUndefined()
	})

	test('field description', () => {
		const schema = createSchema(DescriptionModel)

		expect(schema.model.entities.Entity2.fields.title.description).toBe('Title description')
		expect(schema.model.entities.Entity3.fields.title.description).toBeUndefined()
	})

	test('mixed fields description', () => {
		const schema = createSchema(DescriptionModel)

		expect(schema.model.entities.Entity4.fields.title.description).toBe('Title description')
		expect(schema.model.entities.Entity4.fields.order.description).toBeUndefined()
	})

	test('relation descriptions', () => {
		const schema = createSchema(DescriptionModel)

		// oneHasMany
		expect(schema.model.entities.Entity1.fields.entities2.description).toBe('One has many description')

		// oneHasOne
		expect(schema.model.entities.Entity1.fields.entity3.description).toBe('One has one description')

		// manyHasOne
		expect(schema.model.entities.Entity2.fields.entity1.description).toBe('Many has one description')

		// manyHasMany
		expect(schema.model.entities.Entity2.fields.entities5.description).toBe('Many has many description')

		// oneHasOneInverse
		expect(schema.model.entities.Entity3.fields.entity1.description).toBe('One has one inverse description')

		// manyHasManyInverse
		expect(schema.model.entities.Entity4.fields.entities5.description).toBe('Many has many inverse description')

		// Test a relation without description
		expect(schema.model.entities.Entity5.fields.entities2.description).toBeUndefined()

		// Test oneHasOne without inverse
		expect(schema.model.entities.Entity1.fields.entity3.description).toBe('One has one description')

		// Test manyHasMany without inverse
		expect(schema.model.entities.Entity5.fields.entities4.description).toBe('Many has many without inverse')
	})
})
