import { InputValidation as v } from '@contember/schema-definition'
import { SchemaDefinition as d } from '@contember/schema-definition/dist/src/model'
import { createSchema, testCreate } from '../utils'
import { suite } from 'uvu'

class Item {
	@v.assert(v.rules.lengthRange(5, 6), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})
const test = suite('Length range rule')
test('fails when value not valid #1', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcd' },
		errors: ['failure'],
	})
})
test('fails when value not valid #2', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcdefg' },
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
