import { Input, Model } from '@contember/schema'
import { OrderByHelper } from '../../../src/mapper'
import { ObjectNode } from '../../../src/inputProcessing'
import * as assert from 'uvu/assert'
import { suite } from 'uvu'

const entity: Model.Entity = {
	name: 'Foo',
	primary: 'id',
	primaryColumn: 'id',
	tableName: 'foo',
	fields: {},
	unique: {},
}

const orderByHelperTest = suite('order by helper')

orderByHelperTest('set default order by without defined order', () => {
	const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

	const defaultOrderBy = [{ path: ['lorem', 'ipsum'], direction: Input.OrderDirection.desc }]
	const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, defaultOrderBy)
	assert.equal(newNode.args.orderBy, [
		{ lorem: { ipsum: Input.OrderDirection.desc } },
		{ id: Input.OrderDirection.asc },
	])
})

orderByHelperTest('appends primary order by with already defined order by', () => {
	const objectNode = new ObjectNode(
		'test',
		'test',
		[],
		{
			orderBy: [{ foo: { bar: Input.OrderDirection.asc } }],
		},
		{},
		[],
	)

	const defaultOrderBy = [{ path: ['lorem', 'ipsum'], direction: Input.OrderDirection.desc }]
	const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, defaultOrderBy)
	assert.equal(newNode.args.orderBy, [{ foo: { bar: Input.OrderDirection.asc } }, { id: Input.OrderDirection.asc }])
})

orderByHelperTest('appends primary order by with defined limit/offset', () => {
	const objectNode = new ObjectNode(
		'test',
		'test',
		[],
		{
			offset: 10,
			limit: 10,
		},
		{},
		[],
	)

	const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, [])
	assert.equal(newNode.args.orderBy, [{ id: Input.OrderDirection.asc }])
})

orderByHelperTest('does not append default order by', () => {
	const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

	const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, [])
	assert.equal(newNode.args.orderBy, undefined)
})
orderByHelperTest.run()
