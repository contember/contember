import 'jasmine'
import { Input, Model } from '@contember/schema'
import { OrderByHelper } from '../../../src/sql/select/OrderByHelper'
import { ObjectNode } from '../../../src/inputProcessing'

const entity: Model.Entity = {
	name: 'Foo',
	primary: 'id',
	primaryColumn: 'id',
	tableName: 'foo',
	fields: {},
	unique: {},
}

describe('order by helper', () => {
	it('sets default order by without defined order', () => {
		const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

		const defaultOrderBy = [{ path: ['lorem', 'ipsum'], direction: Input.OrderDirection.desc }]
		const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, defaultOrderBy)
		expect(newNode.args.orderBy).toEqual([
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
		expect(newNode.args.orderBy).toEqual([{ foo: { bar: Input.OrderDirection.asc } }, { id: Input.OrderDirection.asc }])
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
		expect(newNode.args.orderBy).toEqual([{ id: Input.OrderDirection.asc }])
	})

	it('does not append default order by', () => {
		const objectNode = new ObjectNode('test', 'test', [], {}, {}, [])

		const newNode = OrderByHelper.appendDefaultOrderBy(entity, objectNode, [])
		expect(newNode.args.orderBy).toEqual(undefined)
	})
})
