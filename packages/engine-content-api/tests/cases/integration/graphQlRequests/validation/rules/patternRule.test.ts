import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils.js'
import { suite } from 'vitest'
import { describe, it, assert } from 'vitest'

class Item {
	@v.assert(v.rules.pattern(/.+@.+/), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})

describe('Pattern rule', () => {
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd' },
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

