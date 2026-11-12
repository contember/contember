import { describe, expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

const bundle = async (fixture: string): Promise<string> => {
	const result = await Bun.build({
		entrypoints: [fileURLToPath(new URL(`./fixtures/${fixture}`, import.meta.url))],
		target: 'node',
	})
	expect(result.success).toBe(true)
	return await result.outputs[0].text()
}

describe('tree shaking', () => {
	test('a bundle without the pretty print handler drops it and its color detection', async () => {
		const code = await bundle('jsonHandlerConsumer.ts')
		expect(code).toContain('JsonStreamLoggerHandler')
		expect(code).not.toContain('PrettyPrintLoggerHandler')
		expect(code).not.toContain('styleText')
	})

	test('a bundle with the pretty print handler keeps it', async () => {
		const code = await bundle('prettyPrintHandlerConsumer.ts')
		expect(code).toContain('PrettyPrintLoggerHandler')
		expect(code).toContain('styleText')
	})
})
