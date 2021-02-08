import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from '../utils'
import { suite } from 'uvu'

class Item {
	@v.assert(v.rules.or(v.rules.pattern(/.+@.+/), v.rules.minLength(5)), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
const test = suite('Logical OR rule')

test('fails when value not valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abc' },
		errors: ['failure'],
	})
})

test('succeeds when value valid #1', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'a@b' },
		errors: [],
	})
})

test('succeeds when value valid #2', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcdeagffg' },
		errors: [],
	})
})
test.run()
