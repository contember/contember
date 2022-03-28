import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { describe, it, assert } from 'vitest'

class Item {
	@v.assert(v.rules.range(5, 6), 'failure')
	value = d.intColumn()
}

const schema = createSchema({
	Item,
})

describe('Range rule', () => {
	it('fails when value not valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 4 },
			errors: ['failure'],
		})
	})
	it('fails when value not valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 7 },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 5 },
			errors: [],
		})
	})
})

