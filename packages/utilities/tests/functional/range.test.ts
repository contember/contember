import { describe, expect, test } from 'vitest'
import { range } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.range', function () {
		expect(range(1, 1)).toEqual([1])
		expect(range(1, 4)).toEqual([1, 2, 3, 4])
		expect(range(0, 4, 2)).toEqual([0, 2, 4])
		expect(range(5, 2)).toEqual([5, 4, 3, 2])
		expect(range(5, 2, 2)).toEqual([5, 3])
	})
})
