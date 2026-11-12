import { afterEach, describe, expect, test } from 'bun:test'
import { formatTable, setColorsEnabled, style, terminalSupportsColor } from '../../../src/index.js'

afterEach(() => setColorsEnabled(false))

describe('style', () => {
	test('returns the text unchanged when colors are off', () => {
		setColorsEnabled(false)
		expect(style('red', 'x')).toBe('x')
		expect(style(['bgRedBright', 'white'], 'x')).toBe('x')
	})

	test('wraps the text in the styles, outermost first', () => {
		setColorsEnabled(true)
		expect(style('red', 'x')).toBe('\u001b[31mx\u001b[39m')
		expect(style(['bgRedBright', 'white'], 'x')).toBe('\u001b[101m\u001b[37mx\u001b[39m\u001b[49m')
	})

	test.skipIf(process.stdout.isTTY === true || process.env.FORCE_COLOR !== undefined)(
		'a non-TTY stdout without FORCE_COLOR has no color support',
		() => {
			expect(terminalSupportsColor).toBe(false)
		},
	)
})

describe('formatTable', () => {
	const columns = [{ field: 'status', name: 'Status' }, { field: 'name', name: 'Migration' }] as const

	test('pads cells to the widest value and frames the table', () => {
		setColorsEnabled(false)
		expect(formatTable(columns, [{ status: 'Executed', name: '2024-01-01-a' }, { status: 'Skip', name: 'b' }])).toBe([
			'+----------+--------------+',
			'| Status   | Migration    |',
			'+----------+--------------+',
			'| Executed | 2024-01-01-a |',
			'| Skip     | b            |',
			'+----------+--------------+',
		].join('\n'))
	})

	test('ignores ANSI styling when measuring and renders missing cells empty', () => {
		setColorsEnabled(true)
		const lines = formatTable(columns, [{ status: style('red', 'ERROR') }]).split('\n')
		expect(lines[0]).toBe('+--------+-----------+')
		expect(lines[1]).toBe('| \u001b[1mStatus\u001b[22m | \u001b[1mMigration\u001b[22m |')
		expect(lines[3]).toBe('| \u001b[31mERROR\u001b[39m  |           |')
	})
})
