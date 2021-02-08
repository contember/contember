import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { suite } from 'uvu'

class Item {
	@v.assert(v.rules.not(v.rules.pattern(/.+@.+/)), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
const test = suite('Not rule')
test('fails when value not valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcd@foo' },
		errors: ['failure'],
	})
})

test('succeeds when value valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcde' },
		errors: [],
	})
})
test.run()
