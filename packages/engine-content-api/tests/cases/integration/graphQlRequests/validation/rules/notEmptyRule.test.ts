import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { describe, it, assert } from 'vitest'
class Item {
	@v.assert(v.rules.notEmpty(), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})

describe('Not empty rule', () => {


	it('fails when value not valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: {},
			errors: ['failure'],
		})
	})
	it('fails when value not valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: null },
			errors: ['failure'],
		})
	})
	it('fails when value not valid #3', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: '' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd' },
			errors: [],
		})
	})
})


