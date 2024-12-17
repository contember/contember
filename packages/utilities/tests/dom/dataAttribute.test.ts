import { describe, expect, test } from 'bun:test'
import { dataAttribute } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.dataAttribute', function () {

		expect(dataAttribute(false)).toBeUndefined()
		expect(dataAttribute(true)).toBe('')
		expect(dataAttribute('string')).toBe('string')
		expect(dataAttribute(0)).toBe('0')
		expect(dataAttribute('')).toBe('')
	})
})
