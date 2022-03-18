import { Input, Model } from '@contember/schema'
import { OrderByHelper } from '../../../src/mapper'
import { ObjectNode } from '../../../src/inputProcessing'
import { describe, it, assert } from 'vitest'

const entity: Model.Entity = {
	name: 'Foo',
	primary: 'id',
	primaryColumn: 'id',
	tableName: 'foo',
	fields: {},
	unique: {},
	eventLog: { enabled: true },
	indexes: {},
	migrations: { enabled: true },
}

describe('order by helper', () => {


	it('set default order by without defined order', () => {
		const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

		const defaultOrderBy = [{ path: ['lorem', 'ipsum'], direction: Input.OrderDirection.desc }]
		const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, defaultOrderBy)
		assert.deepStrictEqual(newNode.args.orderBy, [
			{ lorem: { ipsum: Input.OrderDirection.desc } },
			{ id: Input.OrderDirection.asc },
		])
	})

	it('appends primary order by with already defined order by', () => {
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
		assert.deepStrictEqual(newNode.args.orderBy, [{ foo: { bar: Input.OrderDirection.asc } }, { id: Input.OrderDirection.asc }])
	})

	it('appends primary order by with defined limit/offset', () => {
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
		assert.deepStrictEqual(newNode.args.orderBy, [{ id: Input.OrderDirection.asc }])
	})

	it('does not append default order by', () => {
		const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

		const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, [])
		assert.isUndefined(newNode.args.orderBy)
	})
})
