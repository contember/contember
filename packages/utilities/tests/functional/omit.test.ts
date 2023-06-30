import { describe, expect, test } from 'vitest'
import { omit } from '../../src'

describe('@contember/utilities', function() {
	test('@contember/utilities.omit', function() {
			let obj = {
					a: 1,
					b: 2,
					c: 3,
					d: 4,
					e: 5,
			}

			expect(omit(obj, ['a'])).toEqual({ b: 2, c: 3, d: 4, e: 5 })
			expect(omit(obj, ['a', 'b'])).toEqual({ c: 3, d: 4, e: 5 })
			expect(omit(obj, ['a', 'b', 'c'])).toEqual({ d: 4, e: 5 })
			expect(omit(obj, ['a', 'b', 'c', 'd'])).toEqual({ e: 5 })
			expect(omit(obj, ['a', 'b', 'c', 'd', 'e'])).toEqual({})
	})
})
