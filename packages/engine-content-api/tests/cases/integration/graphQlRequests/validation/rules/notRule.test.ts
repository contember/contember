import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { describe, it, assert } from 'vitest'

class Item {
	@v.assert(v.rules.not(v.rules.pattern(/.+@.+/)), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
describe('Not rule', () => {
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd@foo' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde' },
			errors: [],
		})
	})


})
