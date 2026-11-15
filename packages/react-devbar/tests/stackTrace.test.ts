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

	test('uses the 1-based stack column as a 0-based map column, as source-map lookups did', async () => {
		const url = uniqueUrl('column.js')
		files[url] = generated('column.js.map')
		files[`${url}.map`] = map()
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:16)`)
		expect(frame.line).toBe(3)
	})

	test('joins a relative sourceRoot and fetches the source from there', async () => {
		const url = uniqueUrl('rooted.js')
		files[url] = generated('rooted.js.map')
		files[`${url}.map`] = map({ sourceRoot: 'lib', sourcesContent: undefined })
		files[url.replace('rooted.js', 'lib/boom.ts')] = original
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:17)`)
		expect([frame.fileShort, frame.line, frame.sourceLines?.[2]]).toEqual([`t${fileCounter}/lib/boom.ts`, 3, "  throw new Error('x')"])
	})

	test('keeps an absolute source under an absolute sourceRoot and joins one outside it', async () => {
		const url = uniqueUrl('absolute.js')
		files[url] = generated('absolute.js.map')
		files[`${url}.map`] = JSON.stringify({
			version: 3,
			sourceRoot: '/root/',
			sources: ['/root/pkg/inside.ts', '/other/outside.ts'],
			sourcesContent: [original, original],
			mappings: 'AACA,gBCCE',
		})
		const frames = await resolveStackTrace(`    at a (${url}:1:5)\n    at b (${url}:1:17)`)
		expect(frames.map(it => [it.fileShort, it.line])).toEqual([
			['root/pkg/inside.ts', 2],
			['root/other/outside.ts', 3],
		])
	})

	test('follows the source map of an original source', async () => {
		const url = uniqueUrl('outer.js')
		const middle = generated('middle.js.map')
		files[url] = generated('outer.js.map')
		files[`${url}.map`] = JSON.stringify({ version: 3, sources: ['middle.js'], sourcesContent: [middle], mappings: 'AAAA,gBAAgB' })
		files[url.replace('outer.js', 'middle.js.map')] = map()
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:17)`)
		expect([frame.fileShort, frame.line]).toEqual([`t${fileCounter}/boom.ts`, 3])
	})

	test('prefers a mapping with a source over one without at the same column', async () => {
		const url = uniqueUrl('tie.js')
		files[url] = generated('tie.js.map')
		files[`${url}.map`] = JSON.stringify({ version: 3, sources: ['a.ts', 'b.ts', 'c.ts'], sourcesContent: ['a', 'b', 'c'], mappings: 'A,AEAA' })
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:1)`)
		expect([frame.fileShort, frame.line, frame.sourceLines]).toEqual([`t${fileCounter}/c.ts`, 1, ['c']])
	})

	test('stops following a source map that points back at its own file', async () => {
		const url = uniqueUrl('self.js')
		const text = generated('self.js.map')
		files[url] = text
		files[`${url}.map`] = JSON.stringify({ version: 3, sources: ['self.js'], sourcesContent: [text], mappings: 'AAAA' })
		const [frame] = await resolveStackTrace(`    at boom (${url}:1:1)`)
		expect([frame.fileShort, frame.line]).toEqual([`t${fileCounter}/self.js`, 1])
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

	test('fetches each file once and marks webpack runtime and page frames like stacktracey', async () => {
		const url = `${pageUrl}runtime-${++fileCounter}.js`
		files[url] = 'function __webpack_require__(id) {\n  return modules[id]()\n}\n'
		files[pageUrl] = `<script>function boom(){throw new Error('x')}</script>\n<script>\n//# sourceMappingURL=/maps/page.js.map\n</script>\n`
		files[`${origin}/maps/page.js.map`] = map()
		const frames = await resolveStackTrace(`    at a (${url}:1:1)\n    at b (${url}:2:3)\n    at c (${pageUrl}:1:9)`)
		// The page frame maps to /maps/boom.ts, which is outside the page path, yet a page frame never counts as third party.
		expect(frames.map(it => [it.fileShort, it.thirdParty])).toEqual([
			[`runtime-${fileCounter}.js`, true],
			[`runtime-${fileCounter}.js`, false],
			['maps/boom.ts', false],
		])
		expect(requested).toEqual([url, pageUrl, `${origin}/maps/page.js.map`])
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
