import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils.js'
import { describe, it } from 'vitest'

class Item {
	@v.assert(v.rules.and(v.rules.pattern(/.+@.+/), v.rules.minLength(5)), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
describe('Logical AND rule', () => {

	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'a@b' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde@bb.com' },
			errors: [],
		})
	})
})
