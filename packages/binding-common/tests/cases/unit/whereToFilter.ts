import { expect, it, describe } from 'bun:test'
import { whereToFilter } from '../../../src'

describe('whereToFilter', () => {
	it('complex by', () => {
		expect(
			whereToFilter({
				foo: {
					bar: {
						baz: '123',
						xyz: 456,
					},
				},
			}),
		).toEqual({
			foo: {
				bar: {
					baz: { eq: '123' },
					xyz: { eq: 456 },
				},
			},
		})
	})
})
