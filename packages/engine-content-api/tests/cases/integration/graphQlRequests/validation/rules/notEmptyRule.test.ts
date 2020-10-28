import { InputValidation as v } from '@contember/schema-definition'
import { SchemaDefinition as d } from '@contember/schema-definition/dist/src/model'
import { createSchema, testCreate } from '../utils'
import { suite } from 'uvu'

class Item {
	@v.assert(v.rules.notEmpty(), 'failure')
	value = d.stringColumn()
}

const schema = createSchema({
	Item,
})

const test = suite('Not empty rule')

test('fails when value not valid #1', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: {},
		errors: ['failure'],
	})
})
test('fails when value not valid #2', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: null },
		errors: ['failure'],
	})
})
test('fails when value not valid #3', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: '' },
		errors: ['failure'],
	})
})

test('succeeds when value valid', async () => {
	await testCreate({
		schema,
		entity: 'Item',
		data: { value: 'abcd' },
		errors: [],
	})
})

test.run()
