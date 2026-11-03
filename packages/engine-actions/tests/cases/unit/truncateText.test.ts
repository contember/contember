import { describe, expect, test } from 'bun:test'
import { truncateText } from '../../../src/dispatch/truncateText'

describe('truncateText', () => {
	test('keeps a text up to the limit unchanged', () => {
		expect(truncateText('', 5)).toBe('')
		expect(truncateText('abcd', 5)).toBe('abcd')
		expect(truncateText('abcde', 5)).toBe('abcde')
	})

	test('cuts a text one past the limit and marks the original length', () => {
		expect(truncateText('abcdef', 5)).toBe('abcde… [truncated, 6 characters in total]')
	})

	test('does not split a surrogate pair at the boundary', () => {
		// '😀' is two UTF-16 code units, the limit falls between them
		const truncated = truncateText('abcd😀xyz', 5)
		expect(truncated).toBe('abcd… [truncated, 9 characters in total]')
		expect(() => encodeURIComponent(truncated)).not.toThrow()
	})

	test('keeps a surrogate pair ending exactly at the limit', () => {
		expect(truncateText('abc😀xyz', 5)).toBe('abc😀… [truncated, 8 characters in total]')
	})
})
