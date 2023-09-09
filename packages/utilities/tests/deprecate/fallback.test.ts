import { describe, expect, expectTypeOf, it } from 'vitest'
import { fallback } from '../../src'

describe('@contember/utilities.fallback', function () {
	it('returns the fallback value if the condition is true', () => {
		expect(fallback(1, true, 2)).equals(2)
	})

	it('returns the fallback value if the condition is true with correct union type', () => {
		const border = 0 as boolean | 0 | 1 | 2 | 3 | 4 | 5
		const border2 = fallback(border, border === 0, false)

		expect(border2).equals(false)
		expectTypeOf(border2).toEqualTypeOf<typeof border2>(false)
	})

	it('returns the value if the condition is false', () => {
		expect(fallback(1, false, 2)).equals(1)
	})
})
