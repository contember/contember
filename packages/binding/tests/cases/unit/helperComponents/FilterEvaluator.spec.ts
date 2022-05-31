import { describe, expect, it } from 'vitest'
import { FilterEvaluator } from '../../../../src/helperComponents/helpers/FilterEvaluator'
import { schema } from './schema'
import { EntityAccessor } from '../../../../src'

const entityAccessorMock = {
	name: 'Article',
	getEntity: (name: string) => {
		expect(name).toEqual('category')
		return {
			name: 'Category',
			getField: (name: string) => {
				expect(name).toEqual('title')
				return {
					value: 'Bar',
				}
			},
		}
	},
	getField: (name: string) => {
		expect(name).toEqual('title')
		return {
			value: 'Lorem ipsum',
		}
	},
} as EntityAccessor
describe('filter evaluator', () => {
	it('equals', () => {
		const filterEvaluator = new FilterEvaluator(schema)
		expect(filterEvaluator.evaluateFilter(entityAccessorMock, { title: { eq: 'Lorem ipsum' } })).toEqual(true)
	})

	it('equals fails', () => {
		const filterEvaluator = new FilterEvaluator(schema)
		expect(filterEvaluator.evaluateFilter(entityAccessorMock, { title: { eq: 'Foo' } })).toEqual(false)
	})

	it('and', () => {
		const filterEvaluator = new FilterEvaluator(schema)
		expect(filterEvaluator.evaluateFilter(entityAccessorMock, { and: [{ title: { eq: 'Lorem ipsum' } }, { title: { isNull: false } }] })).toEqual(true)
	})

	it('not', () => {
		const filterEvaluator = new FilterEvaluator(schema)
		expect(filterEvaluator.evaluateFilter(entityAccessorMock, { not: { title: { eq: 'Bar' } } })).toEqual(true)
	})

	it('equals over relation', () => {
		const filterEvaluator = new FilterEvaluator(schema)
		expect(filterEvaluator.evaluateFilter(entityAccessorMock, { category: { title: { eq: 'Bar' } } })).toEqual(true)
	})
})
