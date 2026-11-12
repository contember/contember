import { afterEach, describe, expect, test } from 'bun:test'
import { Writable } from 'node:stream'
import { createLogger, LogTextStyler, PrettyPrintLoggerHandler } from '../../../src/index.js'

const originalForceColor = process.env.FORCE_COLOR

afterEach(() => {
	if (originalForceColor === undefined) {
		delete process.env.FORCE_COLOR
	} else {
		process.env.FORCE_COLOR = originalForceColor
	}
})

const capture = () => {
	const chunks: string[] = []
	const stream = new Writable({
		write(chunk, _encoding, callback) {
			chunks.push(String(chunk))
			callback()
		},
	})
	return { stream, text: () => chunks.join('') }
}

const logWithFormatter = () => {
	const { stream, text } = capture()
	let receivedStyle: LogTextStyler | undefined
	const handler = new PrettyPrintLoggerHandler(stream, {
		formatters: {
			uri: ({ attributes, style }) => {
				receivedStyle = style
				return { line: style('green', `GET ${attributes.uri}`) }
			},
		},
	})
	createLogger(handler).warn('hello', { uri: '/x', other: 1 })
	return { text: text(), receivedStyle }
}

describe('PrettyPrintLoggerHandler', () => {
	test('writes plain text when colors are off', () => {
		process.env.FORCE_COLOR = '0'
		const { text, receivedStyle } = logWithFormatter()
		expect(text).toMatch(/^\d{4}-\d\d-\d\dT[\d:]+\.\d+Z warn {2}hello\n/)
		expect(text).toContain('GET /x\n')
		expect(text).toContain('other: 1\n')
		expect(text).not.toContain('\u001b[')
		expect(receivedStyle?.(['bold', 'red'], 'x')).toBe('x')
	})

	test('styles the level, attributes and formatter output when colors are forced', () => {
		process.env.FORCE_COLOR = '1'
		const { text, receivedStyle } = logWithFormatter()
		expect(text).toContain('\u001b[93mwarn \u001b[39m')
		expect(text).toContain('\u001b[32mGET /x\u001b[39m\n')
		expect(text).toContain('\u001b[2mother: 1\n\u001b[22m')
		expect(receivedStyle?.(['bold', 'red'], 'x')).toBe('\u001b[1m\u001b[31mx\u001b[39m\u001b[22m')
	})
})
