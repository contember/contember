import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import Koa from 'koa'
import { IncomingHttpHeaders, IncomingMessage, request, Server } from 'node:http'
import { AddressInfo, connect, Socket } from 'node:net'
import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib'
import {
	createRequestBodyMiddleware,
	parseByteSize,
	parseFormBody,
	parseJsonBody,
	parseMediaType,
	readRequestText,
} from '../../../src/application/requestBody.js'

describe('parseByteSize', () => {
	test('reads plain bytes and binary units', () => {
		expect(parseByteSize('0')).toBe(0)
		expect(parseByteSize('100')).toBe(100)
		expect(parseByteSize('100b')).toBe(100)
		expect(parseByteSize('56kb')).toBe(56 * 1024)
		expect(parseByteSize('1mb')).toBe(1048576)
		expect(parseByteSize('1.5 MB')).toBe(1572864)
		expect(parseByteSize(' 2gb ')).toBe(2 * 1024 ** 3)
	})

	test('rejects anything else', () => {
		for (const value of ['', 'mb', '-1', '+1mb', '1e3', '0x10', '10 megabytes', '1.mb', '99999pb']) {
			expect(parseByteSize(value)).toBeUndefined()
		}
	})
})

describe('parseMediaType', () => {
	test('lower-cases the type and drops valid parameters', () => {
		expect(parseMediaType('application/json')).toBe('application/json')
		expect(parseMediaType('Application/JSON')).toBe('application/json')
		expect(parseMediaType('application/json; charset=utf-8')).toBe('application/json')
		expect(parseMediaType('application/json;charset="utf-8"')).toBe('application/json')
		expect(parseMediaType('application/json ; charset=utf-8')).toBe('application/json')
		expect(parseMediaType('text/plain; a=1; b="x\\"y"')).toBe('text/plain')
	})

	test('accepts one trailing semicolon', () => {
		expect(parseMediaType('application/json;')).toBe('application/json')
	})

	test('rejects malformed values', () => {
		for (const value of ['', 'json', 'application/json, text/plain', 'application/json; charset', 'application/json;;', 'a/b; x="open', '/json']) {
			expect(parseMediaType(value)).toBeUndefined()
		}
	})
})

describe('parseJsonBody', () => {
	test('accepts objects and arrays, and an empty body as {}', () => {
		expect(parseJsonBody('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
		expect(parseJsonBody(' \n\t[1]')).toEqual({ ok: true, value: [1] })
		expect(parseJsonBody('')).toEqual({ ok: true, value: {} })
	})

	test('rejects other JSON values and invalid JSON', () => {
		for (const text of ['1', '"a"', 'null', 'true', '{bad', '\v{}']) {
			expect(parseJsonBody(text)).toEqual({ ok: false })
		}
	})

	test('rejects a __proto__ key at any depth, in any escaped spelling', () => {
		expect(parseJsonBody('{"__proto__":{"admin":true}}')).toEqual({ ok: false })
		expect(parseJsonBody('{"a":[{"b":{"\\u005f\\u005fproto\\u005F_" : 1}}]}')).toEqual({ ok: false })
	})

	test('keeps a __proto__ string value and other prototype-like keys', () => {
		expect(parseJsonBody('{"a":"\\"__proto__\\":"}')).toEqual({ ok: true, value: { a: '"__proto__":' } })
		expect(parseJsonBody('{"constructor":{"prototype":{}}}')).toEqual({ ok: true, value: { constructor: { prototype: {} } } })
	})

	test('scans deeply nested input without overflowing the stack', () => {
		const depth = 100_000
		const text = `${'['.repeat(depth)}{"__proto__":1}${']'.repeat(depth)}`
		expect(parseJsonBody(text)).toEqual({ ok: false })
	})
})

describe('parseFormBody', () => {
	test('decodes pairs and collects repeated keys', () => {
		expect(parseFormBody('a=1&b=x+y&b=%E2%9C%93&c')).toEqual({ a: '1', b: ['x y', '✓'], c: '' })
	})

	test('drops prototype keys and empty keys', () => {
		const parsed = parseFormBody('__proto__=1&constructor=2&toString=3&=4&ok=5')
		expect(parsed).toEqual({ ok: '5' })
		expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype)
	})

	test('reads at most 1000 pairs', () => {
		const parsed = parseFormBody(Array.from({ length: 1500 }, (_, i) => `k${i}=${i}`).join('&'))
		expect(Object.keys(parsed)).toHaveLength(1000)
		expect(parsed.k999).toBe('999')
	})
})

type Response = { status: number; headers: IncomingHttpHeaders; body: string }

const send = (port: number, headers: Record<string, string>, body?: string | Buffer, method = 'POST', path = '/'): Promise<Response> =>
	new Promise((resolve, reject) => {
		const req = request({ host: '127.0.0.1', port, path, method, headers }, res => {
			let text = ''
			res.setEncoding('utf8')
			res.on('data', chunk => text += chunk)
			res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: text }))
		})
		req.on('error', reject)
		req.end(body)
	})

/** Writes a raw HTTP request and resolves with the response's status line. */
const sendRaw = (port: number, raw: string | Buffer): Promise<string> =>
	new Promise((resolve, reject) => {
		const socket = connect(port, '127.0.0.1')
		let response = ''
		socket.on('data', chunk => {
			response += chunk
			if (response.includes('\r\n')) {
				resolve(response.slice(0, response.indexOf('\r\n')))
				socket.destroy()
			}
		})
		socket.on('error', reject)
		socket.write(raw)
	})

/** Raw, because the HTTP client adds a Content-Length to a chunked body. */
const sendChunked = (port: number, contentType: string, body: string | Buffer, extraHeaders: readonly string[] = []): Promise<string> => {
	const headers = ['POST / HTTP/1.1', 'Host: localhost', `Content-Type: ${contentType}`, 'Transfer-Encoding: chunked', ...extraHeaders, '', '']
	return sendRaw(
		port,
		Buffer.concat([Buffer.from(`${headers.join('\r\n')}${Buffer.byteLength(body).toString(16)}\r\n`), Buffer.from(body), Buffer.from('\r\n0\r\n\r\n')]),
	)
}

const waitFor = async (condition: () => boolean): Promise<void> => {
	const deadline = Date.now() + 2000
	while (!condition() && Date.now() < deadline) {
		await new Promise(resolve => setTimeout(resolve, 10))
	}
}

describe('request body middleware', () => {
	let server: Server
	let port: number
	const errors: Error[] = []
	let streamedBody: string | undefined

	beforeAll(async () => {
		const koa = new Koa()
		koa.silent = true
		koa.on('error', error => errors.push(error))
		koa.use(createRequestBodyMiddleware({ json: 1000, form: 50 }))
		koa.use(async ctx => {
			if (ctx.get('Content-Type') === 'application/x-ndjson') {
				let text = ''
				for await (const chunk of ctx.req) {
					text += chunk
				}
				streamedBody = text
			}
			ctx.body = { body: ctx.request.body }
		})
		server = koa.listen(0)
		await new Promise(resolve => server.once('listening', resolve))
		port = (server.address() as AddressInfo).port
	})

	afterAll(() => {
		server.close()
	})

	const json = { 'Content-Type': 'application/json' }

	test('parses JSON and form bodies', async () => {
		expect((await send(port, json, '{"a":1}')).body).toBe('{"body":{"a":1}}')
		expect((await send(port, { 'Content-Type': 'application/x-www-form-urlencoded' }, 'a=1')).body).toBe('{"body":{"a":"1"}}')
		expect((await send(port, { 'Content-Type': 'application/vnd.api+json' }, '{"b":2}')).body).toBe('{"body":{"b":2}}')
	})

	test('other content types are not read', async () => {
		expect((await send(port, { 'Content-Type': 'text/plain' }, '{"a":1}')).body).toBe('{"body":{}}')
		expect((await send(port, {}, undefined, 'GET')).body).toBe('{"body":{}}')
		const response = await send(port, { 'Content-Type': 'application/x-ndjson' }, '{"a":1}\n{"a":2}\n')
		expect(response.body).toBe('{"body":{}}')
		expect(streamedBody).toBe('{"a":1}\n{"a":2}\n')
	})

	test('invalid JSON and a __proto__ key are 400', async () => {
		expect(await send(port, json, '{bad')).toMatchObject({ status: 400, body: 'Bad Request' })
		expect(await send(port, json, '"str"')).toMatchObject({ status: 400 })
		expect(await send(port, json, '{"__proto__":{}}')).toMatchObject({ status: 400 })
	})

	test('limits are 413, by Content-Length and by the bytes received', async () => {
		const tooLong = `{"a":"${'x'.repeat(1000)}"}`
		expect(await send(port, json, tooLong)).toMatchObject({ status: 413, body: 'request entity too large' })
		expect(await sendChunked(port, 'application/json', tooLong)).toStartWith('HTTP/1.1 413 ')
		expect(await sendChunked(port, 'application/json', '{"a":1}')).toStartWith('HTTP/1.1 200 ')
		// a declared length over the limit is refused before any of the body arrives
		const declaredOnly = ['POST / HTTP/1.1', 'Host: localhost', 'Content-Type: application/json', 'Content-Length: 2000', '', '']
		expect(await sendRaw(port, declaredOnly.join('\r\n'))).toStartWith('HTTP/1.1 413 ')
		expect(await send(port, { 'Content-Type': 'application/x-www-form-urlencoded' }, `a=${'x'.repeat(50)}`)).toMatchObject({ status: 413 })
		expect(await send(port, json, `{"a":"${'x'.repeat(992)}"}`)).toMatchObject({ status: 200 })
	})

	test('compressed bodies are decompressed, and the limit applies after decompression', async () => {
		expect((await send(port, { ...json, 'Content-Encoding': 'gzip' }, gzipSync('{"g":1}'))).body).toBe('{"body":{"g":1}}')
		expect((await send(port, { ...json, 'Content-Encoding': 'deflate' }, deflateSync('{"d":1}'))).body).toBe('{"body":{"d":1}}')
		expect((await send(port, { ...json, 'Content-Encoding': 'br' }, brotliCompressSync('{"b":1}'))).body).toBe('{"body":{"b":1}}')
		const bomb = gzipSync(`{"a":"${'x'.repeat(100_000)}"}`)
		expect(bomb.length).toBeLessThan(1000)
		expect(await send(port, { ...json, 'Content-Encoding': 'gzip' }, bomb)).toMatchObject({ status: 413 })
	})

	test('compressed input is capped too, even when it inflates to nothing', async () => {
		// 200 empty gzip members: about 4 KB on the wire, 0 bytes decompressed
		const emptyMembers = Buffer.concat(Array.from({ length: 200 }, () => gzipSync('')))
		expect(await send(port, { ...json, 'Content-Encoding': 'gzip' }, emptyMembers)).toMatchObject({ status: 413 })
		expect(await sendChunked(port, 'application/json', emptyMembers, ['Content-Encoding: gzip'])).toStartWith('HTTP/1.1 413 ')
		expect((await send(port, { ...json, 'Content-Encoding': 'gzip' }, Buffer.concat([gzipSync(''), gzipSync('{"a":1}')]))).body).toBe(
			'{"body":{"a":1}}',
		)
	})

	test('an unknown encoding is 415, a corrupt one 400', async () => {
		expect(await send(port, { ...json, 'Content-Encoding': 'compress' }, '{}')).toMatchObject({ status: 415, body: 'Unsupported Media Type' })
		expect(await send(port, { ...json, 'Content-Encoding': 'gzip' }, 'not gzip')).toMatchObject({ status: 400 })
	})

	test('a body cut short fails with 400 instead of hanging', async () => {
		errors.length = 0
		for (const encoding of [undefined, 'gzip']) {
			const socket = connect(port, '127.0.0.1')
			const headers = [`POST / HTTP/1.1`, 'Host: localhost', 'Content-Type: application/json', 'Content-Length: 800']
			const prefix = encoding ? gzipSync('{"a":"' + 'x'.repeat(10)).subarray(0, 10) : Buffer.from('{"a":')
			socket.write([...headers, ...(encoding ? [`Content-Encoding: ${encoding}`] : []), '', ''].join('\r\n'))
			socket.write(prefix)
			await new Promise(resolve => setTimeout(resolve, 50))
			socket.destroy()
		}
		await waitFor(() => errors.length >= 2)
		expect(errors.map(it => [Reflect.get(it, 'status'), it.message])).toEqual([[400, 'request aborted'], [400, 'request aborted']])
	})
})

describe('readRequestText on a request that cannot emit anymore', () => {
	test('a closed request is 400 at once', async () => {
		const closed = new IncomingMessage(new Socket())
		closed.headers = {}
		closed.destroy()
		await expect(readRequestText(closed, 100)).rejects.toMatchObject({ failure: { status: 400, message: 'request aborted' } })
	})

	test('a consumed request is 500 at once', async () => {
		const consumed = new IncomingMessage(new Socket())
		consumed.headers = {}
		consumed.push('{}')
		consumed.push(null)
		consumed.resume()
		await new Promise(resolve => consumed.once('end', resolve))
		await expect(readRequestText(consumed, 100)).rejects.toMatchObject({ failure: { status: 500 } })
	})

	test('an unknown encoding rejects rather than throws', async () => {
		const compressed = new IncomingMessage(new Socket())
		compressed.headers = { 'content-encoding': 'compress' }
		await expect(readRequestText(compressed, 100)).rejects.toMatchObject({ failure: { status: 415 } })
	})
})

describe('request body middleware after other middlewares', () => {
	let server: Server
	let port: number
	const errors: Error[] = []
	const completed: string[] = []

	beforeAll(async () => {
		const koa = new Koa()
		koa.silent = true
		koa.on('error', error => errors.push(error))
		koa.use(async (ctx, next) => {
			if (ctx.path === '/slow') {
				await new Promise(resolve => setTimeout(resolve, 100))
			} else if (ctx.path === '/consumed') {
				for await (const _ of ctx.req) {
					// drained by an earlier middleware
				}
			} else if (ctx.path === '/preset') {
				ctx.request.body = { preset: true }
			}
			await next()
		})
		koa.use(createRequestBodyMiddleware({ json: 1000, form: 50 }))
		koa.use(async ctx => {
			completed.push(ctx.path)
			ctx.body = { body: ctx.request.body }
		})
		server = koa.listen(0)
		await new Promise(resolve => server.once('listening', resolve))
		port = (server.address() as AddressInfo).port
	})

	afterAll(() => {
		server.close()
	})

	const json = { 'Content-Type': 'application/json' }

	test('a body set earlier is kept', async () => {
		expect((await send(port, json, '{"a":1}', 'POST', '/preset')).body).toBe('{"body":{"preset":true}}')
	})

	test('a body already read is a 500, not a pending request', async () => {
		expect(await send(port, json, '{"a":1}', 'POST', '/consumed')).toMatchObject({ status: 500 })
	})

	test('a client gone before the parser runs does not leave the request pending', async () => {
		errors.length = 0
		const socket = connect(port, '127.0.0.1')
		socket.write(['POST /slow HTTP/1.1', 'Host: localhost', 'Content-Type: application/json', 'Content-Length: 7', '', '{"a":1}'].join('\r\n'))
		await new Promise(resolve => setTimeout(resolve, 20))
		socket.destroy()
		// Node reports the abort (400); Bun still delivers the buffered body, so the request completes
		await waitFor(() => errors.length > 0 || completed.includes('/slow'))
		expect(errors.length > 0 || completed.includes('/slow')).toBe(true)
	})
})
