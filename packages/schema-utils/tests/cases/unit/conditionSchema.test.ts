import { assert, test, describe } from 'vitest'
import { conditionSchema } from '../../../src/type-schema'
import { Model } from '@contember/schema'

describe('condition schema', () => {
	test('accept composite type', () => {
		const condition = {
			and: [{ isNull: true }, { not: { isNull: false } }],
		}
		assert.deepStrictEqual(conditionSchema()(condition), condition)
	})

	test('accept string-only condition for unknown type', () => {
		const condition = {
			containsCI: 'foo',
		}
		assert.deepStrictEqual(conditionSchema()(condition), condition)
	})

	test('accept string-only condition for string type', () => {
		const condition = {
			containsCI: 'foo',
		}
		assert.deepStrictEqual(conditionSchema(Model.ColumnType.String)(condition), condition)
	})

	test('reject string-only condition for int type', () => {
		const condition = {
			containsCI: 'foo',
		}
		assert.throw(() => conditionSchema(Model.ColumnType.Int)(condition), 'value at root: extra property containsCI found')
	})


	test('accept non-json condition for unknown type', () => {
		const condition = {
			eq: 'foo',
		}
		assert.deepStrictEqual(conditionSchema()(condition), condition)
	})

	test('accept non-json condition for string type', () => {
		const condition = {
			eq: 'foo',
		}
		assert.deepStrictEqual(conditionSchema(Model.ColumnType.String)(condition), condition)
	})

	test('reject non-json condition for json type', () => {
		const condition = {
			eq: 'foo',
		}
		assert.throw(() => conditionSchema(Model.ColumnType.Json)(condition), 'value at root: extra property eq found')
	})
})
