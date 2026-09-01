import { expect, spyOn, test } from 'bun:test'
import { ConsoleSpanExporter, OtlpHttpSpanExporter, ReadableSpan, TestSpanExporter } from '../../../src/index.js'

const span: ReadableSpan = {
	name: 'GET /articles',
	context: { traceId: '4bf92f3577b34da6a3ce929d0e0e4736', spanId: '00f067aa0ba902b7', traceFlags: 1 },
	kind: 'server',
	startTimeUnixNano: 1700000000000000000n,
	endTimeUnixNano: 1700000000123456789n,
	attributes: {},
	events: [],
	links: [],
	status: { code: 'ok' },
}

const captureFetch = async (endpoint: string): Promise<Request> => {
	const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }))
	try {
		await new OtlpHttpSpanExporter({ endpoint, resource: { serviceName: 'contember' }, timeoutMs: 1000 }).export([span])
		const [url, init] = fetchSpy.mock.calls[0]
		return new Request(url, init)
	} finally {
		fetchSpy.mockRestore()
	}
}

test('appends the traces path exactly once', async () => {
	expect((await captureFetch('http://collector:4318')).url).toBe('http://collector:4318/v1/traces')
	expect((await captureFetch('http://collector:4318/')).url).toBe('http://collector:4318/v1/traces')
	expect((await captureFetch('http://collector:4318/v1/traces')).url).toBe('http://collector:4318/v1/traces')
})

test('posts OTLP JSON', async () => {
	const request = await captureFetch('http://collector:4318')
	expect(request.method).toBe('POST')
	expect(request.headers.get('content-type')).toBe('application/json')
	expect(JSON.parse(await request.text()).resourceSpans[0].scopeSpans[0].spans[0].traceId).toBe(span.context.traceId)
})

test('throws on a non-ok response', async () => {
	const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 503 }))
	try {
		const exporter = new OtlpHttpSpanExporter({ endpoint: 'http://collector:4318', resource: { serviceName: 'contember' } })
		await expect(exporter.export([span])).rejects.toThrow('503')
	} finally {
		fetchSpy.mockRestore()
	}
})

test('skips an empty batch', async () => {
	const fetchSpy = spyOn(globalThis, 'fetch')
	try {
		await new OtlpHttpSpanExporter({ endpoint: 'http://collector:4318', resource: { serviceName: 'contember' } }).export([])
		expect(fetchSpy).not.toHaveBeenCalled()
	} finally {
		fetchSpy.mockRestore()
	}
})

test('test exporter collects the exported spans', async () => {
	const exporter = new TestSpanExporter()
	await exporter.export([span])
	await exporter.export([span])
	expect(exporter.spans).toHaveLength(2)
	await exporter.shutdown()
})

test('console exporter prints one line per span', async () => {
	const infoSpy = spyOn(console, 'info').mockImplementation(() => {})
	try {
		await new ConsoleSpanExporter().export([span, span])
		expect(infoSpy).toHaveBeenCalledTimes(2)
		expect(String(infoSpy.mock.calls[0][0])).toContain('GET /articles')
	} finally {
		infoSpy.mockRestore()
	}
})
