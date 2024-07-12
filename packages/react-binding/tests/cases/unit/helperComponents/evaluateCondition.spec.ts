import { describe, expect, it } from 'vitest'
import { evaluateCondition } from '../../../../src/helperComponents/helpers/evaluateCondition'
import { GraphQlLiteral } from '@contember/client'

describe('evaluate condition', () => {
	it('always', () => {
		expect(evaluateCondition(null, { always: true })).toEqual(true)
	})

	it('never', () => {
		expect(evaluateCondition(null, { never: true })).toEqual(false)
	})

	it('empty or', () => {
		expect(evaluateCondition(null, {
			or: [],
		})).toEqual(false)
	})

	it('or OK', () => {
		expect(evaluateCondition(null, {
			or: [{ always: true }, { never: true }],
		})).toEqual(true)
	})

	it('or NOK', () => {
		expect(evaluateCondition(null, {
			or: [{ never: true }],
		})).toEqual(false)
	})


	it('empty and', () => {
		expect(evaluateCondition(null, {
			and: [],
		})).toEqual(true)
	})

	it('and NOK', () => {
		expect(evaluateCondition(null, {
			and: [{ always: true }, { never: true }],
		})).toEqual(false)
	})

	it('and OK', () => {
		expect(evaluateCondition(null, {
			and: [{ always: true }, { always: true }],
		})).toEqual(true)
	})

	it('not', () => {
		expect(evaluateCondition(null, { not: { never: true } })).toEqual(true)
	})

	it('eq OK', () => {
		expect(evaluateCondition('a', { eq: 'a' })).toEqual(true)
	})

	it('eq graphql literal OK', () => {
		expect(evaluateCondition('a', { eq: new GraphQlLiteral('a') })).toEqual(true)
	})

	it('eq NOK', () => {
		expect(evaluateCondition('a', { eq: 'B' })).toEqual(false)
	})

	it('notEq OK', () => {
		expect(evaluateCondition('a', { notEq: 'b' })).toEqual(true)
	})

	it('isNull OK', () => {
		expect(evaluateCondition(null, { isNull: true })).toEqual(true)
	})

	it('not isNull OK', () => {
		expect(evaluateCondition('a', { isNull: false })).toEqual(true)
	})

	it('isNull NOK', () => {
		expect(evaluateCondition('a', { isNull: true })).toEqual(false)
	})

	it('not isNull NOK', () => {
		expect(evaluateCondition(null, { isNull: false })).toEqual(false)
	})

	it('in OK', () => {
		expect(evaluateCondition('a', { in: ['a', 'b'] })).toEqual(true)
	})

	it('in NOK', () => {
		expect(evaluateCondition('c', { in: ['a', 'b'] })).toEqual(false)
	})

	it('notIn OK', () => {
		expect(evaluateCondition('c', { notIn: ['a', 'b'] })).toEqual(true)
	})

	it('lt OK', () => {
		expect(evaluateCondition(1, { lt: 2 })).toEqual(true)
	})

	it('lt NOK', () => {
		expect(evaluateCondition(1, { lt: 1 })).toEqual(false)
	})

	it('lt null', () => {
		expect(evaluateCondition(null, { lt: 1 })).toEqual(false)
	})

	it('contains OK', () => {
		expect(evaluateCondition('abcd', { contains: 'bc' })).toEqual(true)
	})

	it('contains NOK', () => {
		expect(evaluateCondition('abcd', { contains: 'BC' })).toEqual(false)
	})

	it('containsCI OK', () => {
		expect(evaluateCondition('abcd', { containsCI: 'BC' })).toEqual(true)
	})

	it('contains NOK', () => {
		expect(evaluateCondition('abcd', { containsCI: 'x' })).toEqual(false)
	})

	it('startsWith OK', () => {
		expect(evaluateCondition('abcd', { startsWith: 'ab' })).toEqual(true)
	})

	it('startsWith NOK', () => {
		expect(evaluateCondition('abcd', { startsWith: 'AB' })).toEqual(false)
	})

	it('endsWith OK', () => {
		expect(evaluateCondition('abcd', { endsWith: 'cd' })).toEqual(true)
	})

	it('endsWith NOK', () => {
		expect(evaluateCondition('abcd', { endsWith: 'CD' })).toEqual(false)
	})
})
