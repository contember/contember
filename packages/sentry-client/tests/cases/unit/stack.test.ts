import { describe, expect, test } from 'bun:test'
import { createModuleResolver, parseStack } from '../../../src/stack.js'
import { stackVectors } from './stackVectors.js'

const resolveModule = createModuleResolver('/app/dist')

describe('parseStack', () => {
	for (const [name, { stack, frames }] of Object.entries(stackVectors)) {
		test(`parses the ${name} stack as @sentry/node 7 did`, () => {
			expect(parseStack(stack, resolveModule)).toEqual(frames)
		})
	}

	test('keeps the innermost 50 frames, oldest first', () => {
		const stack = ['Error: deep', ...Array.from({ length: 60 }, (_, i) => `    at level${i} (/app/dist/deep.js:${i + 1}:5)`)].join('\n')
		const frames = parseStack(stack, resolveModule)
		expect(frames).toHaveLength(50)
		expect(frames[0].function).toBe('level49')
		expect(frames[49].function).toBe('level0')
	})

	test('returns no frames for a stack without frame lines', () => {
		expect(parseStack('Error: no frames', resolveModule)).toEqual([])
	})
})

describe('createModuleResolver', () => {
	test('names modules relative to the base path, inside node_modules by package', () => {
		expect(resolveModule('/app/dist/lib/handler.mjs')).toBe('lib:handler')
		expect(resolveModule('/app/dist/index.js')).toBe('index')
		expect(resolveModule('/app/node_modules/pg/lib/client.js')).toBe('pg.lib:client')
		expect(resolveModule('/elsewhere/file.ts')).toBe('file.ts')
		expect(resolveModule(undefined)).toBeUndefined()
	})
})
