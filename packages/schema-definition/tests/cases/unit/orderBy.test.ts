import { Model } from '@contember/schema'
import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '../../../src'


const assert = {
	deepEqual: (a: any, b: any) => expect(a).toStrictEqual(b),
}
namespace OrderByModel {
	@c.OrderBy('title')
	export class Entity1 {
		title = c.stringColumn()
	}

	@c.OrderBy('title', 'ascNullsFirst')
	export class Entity2 {
		title = c.stringColumn()
	}

	@c.OrderBy({ path: ['title'], direction: 'descNullsLast' })
	export class Entity3 {
		title = c.stringColumn()
	}

	@c.OrderBy([
		{ path: ['order'], direction: 'asc' },
		{ path: ['title'], direction: 'descNullsLast' },
	])
	export class Entity4 {
		order = c.intColumn()
		title = c.stringColumn()
	}
}

namespace LegacyOrderBy {
	@c.OrderBy('order')
	@c.OrderBy('title')
	export class Entity5 {
		order = c.intColumn()
		title = c.stringColumn()
	}
}

describe('order by', () => {

	test('simple order by', () => {
		const schema = createSchema(OrderByModel)

		assert.deepEqual(schema.model.entities.Entity1.orderBy, [{ path: ['title'], direction: Model.OrderDirection.asc }])
	})

	test('custom direction', () => {
		const schema = createSchema(OrderByModel)

		assert.deepEqual(schema.model.entities.Entity2.orderBy, [{ path: ['title'], direction: Model.OrderDirection.ascNullsFirst }])
	})

	test('object input order by', () => {
		const schema = createSchema(OrderByModel)

		assert.deepEqual(schema.model.entities.Entity3.orderBy, [{ path: ['title'], direction: Model.OrderDirection.descNullsLast }])
	})

	test('multiple order by', () => {
		const schema = createSchema(OrderByModel)

		assert.deepEqual(schema.model.entities.Entity4.orderBy, [
			{ path: ['order'], direction: Model.OrderDirection.asc },
			{ path: ['title'], direction: Model.OrderDirection.descNullsLast },
		])
	})

	test('deprecated orderBy', () => {

		const origWarn = console.warn
		let msg = ''
		console.warn = (m: string) => msg = m

		const schema = createSchema(LegacyOrderBy)


		assert.deepEqual(schema.model.entities.Entity5.orderBy, [
			{ path: ['title'], direction: Model.OrderDirection.asc },
			{ path: ['order'], direction: Model.OrderDirection.asc },
		])

		expect(msg).toBe('DEPRECATED: The "order by" property for the entity Entity5 has already been defined. Using multiple decorators can lead to unexpected order. Please provide an array containing all the \'order by\' items as an input.')

		console.warn = origWarn
	})
})

