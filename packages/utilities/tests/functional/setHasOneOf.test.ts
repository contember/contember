import { describe, expect, test } from 'vitest'
import { setHasOneOf } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.setHasOneOf', function () {
		let set = new Set([1, 2, 3])

		expect(setHasOneOf(set, [1, 2])).equals(true)
		expect(setHasOneOf(set, [2, 3])).equals(true)
		expect(setHasOneOf(set, [3, 4])).equals(true)
		expect(setHasOneOf(set, [4, 5])).equals(false)
	})
})
