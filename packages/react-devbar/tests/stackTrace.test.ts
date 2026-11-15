import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { parseStackFrames, resolveStackTrace } from '../src/stackTrace.js'

// Expected values match what stacktracey 2 with get-source produced for the same stacks and files.
const origin = 'http://localhost:5173'
const pageUrl = `${origin}/app/`

const original = ['// boom.ts', 'export function boom() {', "  throw new Error('x')", '}'].join('\n')
// "AACA" maps column 0 to line 2, "gBACE" maps column 16 to line 3 of boom.ts.
const map = (extra: Record<string, unknown> = {}) =>
	JSON.stringify({ version: 3, sources: ['boom.ts'], sourcesContent: [original], mappings: 'AACA,gBACE', ...extra })
const generated = (mapUrl: string) => `function boom(){throw new Error('x')}\n//# sourceMappingURL=${mapUrl}\n`

let files: Record<string, string> = {}
let requested: string[] = []
const originalFetch = globalThis.fetch

const happyDom: unknown = Reflect.get(window, 'happyDOM')
let previousUrl = window.location.href

beforeEach(() => {
	previousUrl = window.location.href
	if (typeof happyDom === 'object' && happyDom !== null && 'setURL' in happyDom && typeof happyDom.setURL === 'function') {
		happyDom.setURL(pageUrl)
	}
	files = {}
	requested = []
	globalThis.fetch = Object.assign(async (input: string | URL | Request) => {
		const url = new URL(input instanceof Request ? input.url : input, window.location.href).href
		requested.push(url)
		const body = files[url]
		return body === undefined ? new Response('', { status: 404, statusText: 'Not Found' }) : new Response(body)
	}, { preconnect: originalFetch.preconnect })
})

afterEach(() => {
	globalThis.fetch = originalFetch
	if (typeof happyDom === 'object' && happyDom !== null && 'setURL' in happyDom && typeof happyDom.setURL === 'function') {
		happyDom.setURL(previousUrl)
	}
})

let fileCounter = 0
const uniqueUrl = (name: string) => `${origin}/t${++fileCounter}/${name}`

describe('parseStackFrames', () => {
	test('reads V8, Firefox, eval and native frames and skips other lines', () => {
		const frames = parseStackFrames([
			'Error: x',
			`    at Object.boom (${origin}/src/a.js:3:17)`,
			`    at ${origin}/src/b.js:4:5`,
			`boom@${origin}/src/c.js:5:6`,
			`    at eval (eval at run (${origin}/src/d.js:6:7), <anonymous>:1:1)`,
			'    at Array.map (native)',
			'    at new Promise (<anonymous>)',
			'not a frame',
		].join('\n'))
		expect(frames.map(({ callee, file, line, column, native }) => ({ callee, file, line, column, native }))).toEqual([
			{ callee: 'Object.boom', file: `${origin}/src/a.js`, line: 3, column: 17, native: false },
			{ callee: '', file: `${origin}/src/b.js`, line: 4, column: 5, native: false },
			{ callee: 'boom', file: `${origin}/src/c.js`, line: 5, column: 6, native: false },
			{ callee: 'eval', file: `${origin}/src/d.js`, line: 6, column: 7, native: false },
			{ callee: 'Array.map', file: '', line: undefined, column: undefined, native: true },
			{ callee: 'new Promise', file: '', line: undefined, column: undefined, native: false },
		])
	})
})

describe('resolveStackTrace', () => {
	test('maps a frame through a linked source map to the original line', async () => {
		const url = uniqueUrl('boom.js')
		files[url] = generated('boom.js.map')
		files[`${url}.map`] = map()
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:17)`)
		expect(frame).toEqual({
			callee: 'boom',
			line: 3,
			fileShort: `t${fileCounter}/boom.ts`,
			thirdParty: true,
			sourceLines: original.split('\n'),
		})
	})

	test('maps a frame through an inline base64 source map', async () => {
		const url = uniqueUrl('inline.js')
		files[url] = generated(`data:application/json;base64,${btoa(map())}`)
		const [early, late] = await resolveStackTrace(`    at a (${url}:1:5)\n    at b (${url}:1:17)`)
		expect([early.line, late.line]).toEqual([2, 3])
		expect(late.sourceLines?.[2]).toBe("  throw new Error('x')")
	})

	test('fetches an original source the map does not embed', async () => {
		const url = uniqueUrl('fetched.js')
		files[url] = generated('fetched.js.map')
		files[`${url}.map`] = map({ sourcesContent: undefined })
		files[url.replace('fetched.js', 'boom.ts')] = original
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:17)`)
		expect(frame.line).toBe(3)
		expect(frame.sourceLines).toEqual(original.split('\n'))
	})

	test('falls back to the generated file when the map cannot be used', async () => {
		const missingMap = uniqueUrl('missing-map.js')
		files[missingMap] = generated('nope.js.map')
		const brokenMap = uniqueUrl('broken-map.js')
		files[brokenMap] = generated('broken.js.map')
		files[`${brokenMap.replace('broken-map.js', 'broken.js.map')}`] = '{ not json'
		const frames = await resolveStackTrace(`    at a (${missingMap}:1:17)\n    at b (${brokenMap}:1:17)`)
		expect(frames.map(it => [it.line, it.sourceLines?.[0]])).toEqual([
			[1, "function boom(){throw new Error('x')}"],
			[1, "function boom(){throw new Error('x')}"],
		])
	})

	test('keeps the raw frame when its file cannot be fetched, and does not fetch frames without a file', async () => {
		const url = uniqueUrl('gone.js')
		const frames = await resolveStackTrace(`    at a (${url}:7:1)\n    at new Promise (<anonymous>)`)
		expect(frames).toEqual([
			{ callee: 'a', line: 7, fileShort: `t${fileCounter}/gone.js`, thirdParty: true },
			{ callee: 'new Promise', line: undefined, fileShort: '', thirdParty: false },
		])
		expect(requested).toEqual([url])
	})
})
