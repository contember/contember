import { describe, expect, test } from 'vitest'
import { pick } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.pick', function () {
		const from = { a: 1, b: 2 }

		expect(pick(from, ['a'])).toEqual({ a: 1 })
		// @ts-expect-error - 'c' does not exist in { a: 1, b: 2 }
		expect(() => pick(from, ['c'])).throws('Key "c" does not exist in object {"a":1,"b":2}')
	})
})
