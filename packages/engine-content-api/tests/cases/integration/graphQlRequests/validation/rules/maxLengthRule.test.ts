import { describe, it, assert } from 'vitest'
import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'


class Item {
	@v.assert(v.rules.maxLength(5), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
describe('Max length rule', () => {
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcdef' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abc' },
			errors: [],
		})
	})
})
