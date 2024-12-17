import { expect, test, describe } from 'bun:test'
import { conditionSchema } from '../../../src/type-schema'
import { Model } from '@contember/schema'

describe('condition schema', () => {
	test('accept composite type', () => {
		const condition = {
			and: [{ isNull: true }, { not: { isNull: false } }],
		}
		expect(conditionSchema()(condition)).toStrictEqual(condition)
	})

	test('accept string-only condition for unknown type', () => {
		const condition = {
			containsCI: 'foo',
		}
		expect(conditionSchema()(condition)).toStrictEqual(condition)
	})

	test('accept string-only condition for string type', () => {
		const condition = {
			containsCI: 'foo',
		}
		expect(conditionSchema(Model.ColumnType.String)(condition)).toStrictEqual(condition)
	})

	test('reject string-only condition for int type', () => {
		const condition = {
			containsCI: 'foo',
		}
		expect(() => conditionSchema(Model.ColumnType.Int)(condition)).toThrow('value at root: extra property containsCI found')
	})


	test('accept non-json condition for unknown type', () => {
		const condition = {
			eq: 'foo',
		}
		expect(conditionSchema()(condition)).toStrictEqual(condition)
	})

	test('accept non-json condition for string type', () => {
		const condition = {
			eq: 'foo',
		}
		expect(conditionSchema(Model.ColumnType.String)(condition)).toStrictEqual(condition)
	})

	test('reject non-json condition for json type', () => {
		const condition = {
			eq: 'foo',
		}
		expect(() => conditionSchema(Model.ColumnType.Json)(condition)).toThrow('value at root: extra property eq found')
	})
})
