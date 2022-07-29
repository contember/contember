import { describe, it, assert } from 'vitest'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'

describe('condition optimizer', () => {
	const optimizer = new ConditionOptimizer()

	it('remove OR when only 1', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [{ eq: 1 }],
		}), { eq: 1 })
	})

	it('keep OR when > 1', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [{ eq: 1 }, { eq: 2 }],
		}), {
			or: [{ eq: 1 }, { eq: 2 }],
		})
	})

	it('optimizes OR with never', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [{ eq: 1 }, { never: true }],
		}), { eq: 1 })
	})

	it('optimizes OR with always', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [{ eq: 1 }, { always: true }],
		}), true)
	})

	it('optimizes AND with never', () => {
		assert.deepStrictEqual(optimizer.optimize({
			and: [{ eq: 1 }, { never: true }],
		}), false)
	})

	it('optimizes AND with always', () => {
		assert.deepStrictEqual(optimizer.optimize({
			and: [{ eq: 1 }, { always: true }],
		}), { eq: 1 })
	})

	it('optimizes NOT with never', () => {
		assert.deepStrictEqual(optimizer.optimize({
			not: { never: true },
		}), true)
	})

	it('optimizes NOT with always', () => {
		assert.deepStrictEqual(optimizer.optimize({
			not: { always: true },
		}), false)
	})

	it('optimizes empty AND', () => {
		assert.deepStrictEqual(optimizer.optimize({
			and: [],
		}), {})
	})

	it('optimizes empty OR', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [],
		}), {})
	})


	it('flattens AND', () => {
		assert.deepStrictEqual(optimizer.optimize({
			eq: 0,
			and: [
				{ eq: 1 },
				{
					eq: 2,
					and: [
						{ eq: 3 },
						{
							eq: 4,
							and: [{ eq: 5 }, { eq: 6 }],
						},
					],
				},
			],
		}), { and: [{ eq: 0 }, { eq: 1 }, { eq: 2 }, { eq: 3 }, { eq: 4 }, { eq: 5 }, { eq: 6 }] })
	})

	it('combine AND and OR', () => {
		assert.deepStrictEqual(optimizer.optimize({
			or: [
				{ and: [{ eq: 1 }, { eq: 2 }] },
				{ and: [{ eq: 3 }, { eq: 4 }], eq: 5 },
			],
		}), { or: [
			{ and: [{ eq: 1 }, { eq: 2 }] },
			{ and: [{ eq: 3 }, { eq: 4 }, { eq: 5 }] },
		] })
	})

})
