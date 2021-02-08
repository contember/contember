import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { suite } from 'uvu'

class Item {
	@v.assert(v.rules.pattern(/.+@.+/), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})

const test = suite('Pattern rule')

test('fails when value not valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcd' },
		errors: ['failure'],
	})
})

test('succeeds when value valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcde@bb.com' },
		errors: [],
	})
})
test.run()
