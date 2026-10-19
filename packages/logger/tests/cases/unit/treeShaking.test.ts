import { describe, expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

// chalk stays external so the bundler cannot see whether it is side-effect free, as with chalk 4 (CommonJS)
const bundle = async (fixture: string): Promise<string> => {
	const result = await Bun.build({
		entrypoints: [fileURLToPath(new URL(`./fixtures/${fixture}`, import.meta.url))],
		target: 'node',
		external: ['chalk'],
	})
	expect(result.success).toBe(true)
	return await result.outputs[0].text()
}

describe('tree shaking', () => {
	test('a bundle without the pretty print handler does not import chalk', async () => {
		const code = await bundle('jsonHandlerConsumer.ts')
		expect(code).toContain('JsonStreamLoggerHandler')
		expect(code).not.toContain('chalk')
	})

	test('a bundle with the pretty print handler imports chalk', async () => {
		const code = await bundle('prettyPrintHandlerConsumer.ts')
		expect(code).toContain('PrettyPrintLoggerHandler')
		expect(code).toContain('chalk')
	})
})
