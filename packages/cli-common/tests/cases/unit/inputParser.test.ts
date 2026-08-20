import { describe, expect, test } from 'bun:test'
import { InputParser } from '../../../src/application/InputParser.js'
import { OptionMode } from '../../../src/index.js'

describe('inline option values', () => {
	test('preserves separators after the first equals sign', () => {
		const parser = new InputParser([], [{ name: 'value', required: false, deprecated: false, mode: OptionMode.VALUE_REQUIRED }])

		const parsed = parser.parse<{}, { value?: string }>(['--value=left=middle=right'])

		expect(parsed.input.getOption('value')).toBe('left=middle=right')
	})

	test('preserves an empty inline value', () => {
		const parser = new InputParser([], [{ name: 'value', required: false, deprecated: false, mode: OptionMode.VALUE_REQUIRED }])

		const parsed = parser.parse<{}, { value?: string }>(['--value='])

		expect(parsed.input.getOption('value')).toBe('')
	})
})
