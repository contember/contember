import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import Koa from 'koa'
import { IncomingHttpHeaders, request, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import { gunzipSync, gzipSync, inflateSync, zstdDecompressSync } from 'node:zlib'
import { createCompressionMiddleware, isCompressibleType, negotiateEncoding } from '../../../src/application/compression.js'

describe('negotiateEncoding', () => {
	test('no header, identity, or only unsupported encodings: no compression', () => {
		for (const header of ['', 'identity', 'br', 'compress', 'gzip;q=0', 'GZIP;q=0, deflate;q=0']) {
			expect(negotiateEncoding(header)).toBeUndefined()
		}
	})

	test('prefers zstd, then gzip, then deflate, at equal quality', () => {
		expect(negotiateEncoding('gzip, deflate, br, zstd')).toBe('zstd')
		expect(negotiateEncoding('deflate, gzip, br')).toBe('gzip')
		expect(negotiateEncoding('deflate')).toBe('deflate')
		expect(negotiateEncoding('GZip')).toBe('gzip')
	})

	test('quality decides first', () => {
		expect(negotiateEncoding('gzip;q=0.5, deflate')).toBe('deflate')
		expect(negotiateEncoding('zstd;q=0.9, deflate;q=1')).toBe('deflate')
		expect(negotiateEncoding('gzip;q=abc, deflate;q=0.1')).toBe('deflate')
	})

	test('a bare * is gzip, and * covers what is not listed', () => {
		expect(negotiateEncoding('*')).toBe('gzip')
		expect(negotiateEncoding('*;q=0.5, zstd;q=0.1')).toBe('gzip')
		expect(negotiateEncoding('*, identity;q=0')).toBe('zstd')
	})

	test('identity wins only with a higher quality', () => {
		expect(negotiateEncoding('identity;q=1, gzip;q=0.5')).toBeUndefined()
		expect(negotiateEncoding('identity, gzip')).toBe('gzip')
		expect(negotiateEncoding('identity;q=0, gzip;q=0.1')).toBe('gzip')
	})
})

test('isCompressibleType', () => {
	for (
		const type of [
			'application/json',
			'text/html',
			'text/plain',
			'text/css',
			'text/javascript',
			'application/javascript',
			'image/svg+xml',
			'application/manifest+json',
			'Application/JSON',
		]
	) {
		expect(isCompressibleType(type)).toBe(true)
	}
	for (const type of ['', 'image/png', 'font/woff2', 'application/octet-stream', 'application/x-ndjson']) {
		expect(isCompressibleType(type)).toBe(false)
	}
})

type Response = { status: number; headers: IncomingHttpHeaders; body: Buffer }

const get = (port: number, path: string, headers: Record<string, string>, method = 'GET'): Promise<Response> =>
	new Promise((resolve, reject) => {
		const req = request({ host: '127.0.0.1', port, path, method, headers }, res => {
			const chunks: Buffer[] = []
			res.on('data', chunk => chunks.push(chunk))
			res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }))
		})
		req.on('error', reject)
		req.end()
	})

describe('compression middleware', () => {
	let server: Server
	let port: number
	const large = { data: 'x'.repeat(2000) }
	const ndjson = '{"a":1}\n'.repeat(5)

	beforeAll(async () => {
		const koa = new Koa()
		koa.silent = true
		koa.use(createCompressionMiddleware())
		koa.use(async ctx => {
			switch (ctx.path) {
				case '/large':
					ctx.body = large
					break
				case '/small':
					ctx.body = { data: 'x' }
					break
				case '/png':
					ctx.type = 'image/png'
					ctx.body = Buffer.alloc(2000)
					break
				case '/ndjson':
					ctx.compress = true
					ctx.type = 'application/x-ndjson'
					ctx.body = Readable.from([ndjson])
					break
				case '/disabled':
					ctx.compress = false
					ctx.body = large
					break
				case '/no-transform':
					ctx.set('Cache-Control', 'private, no-transform')
					ctx.body = large
					break
				case '/encoded':
					ctx.set('Content-Encoding', 'gzip')
					ctx.type = 'text/plain'
					ctx.body = gzipSync('y'.repeat(2000))
					break
				case '/empty':
					ctx.status = 204
					break
			}
		})
		server = koa.listen(0)
		await new Promise(resolve => server.once('listening', resolve))
		port = (server.address() as AddressInfo).port
	})

	afterAll(() => {
		server.close()
	})

	test('compresses a large JSON body with the negotiated encoding', async () => {
		const gzip = await get(port, '/large', { 'Accept-Encoding': 'gzip, deflate' })
		expect(gzip.headers['content-encoding']).toBe('gzip')
		expect(gzip.headers['content-length']).toBeUndefined()
		expect(gzip.headers.vary).toBe('Accept-Encoding')
		expect(gzip.headers['content-type']).toBe('application/json; charset=utf-8')
		expect(JSON.parse(gunzipSync(gzip.body).toString())).toEqual(large)

		const deflate = await get(port, '/large', { 'Accept-Encoding': 'deflate' })
		expect(JSON.parse(inflateSync(deflate.body).toString())).toEqual(large)

		const zstd = await get(port, '/large', { 'Accept-Encoding': 'zstd, gzip' })
		expect(zstd.headers['content-encoding']).toBe('zstd')
		expect(JSON.parse(zstdDecompressSync(zstd.body).toString())).toEqual(large)
	})

	test('leaves the body alone without an accepted encoding', async () => {
		const response = await get(port, '/large', {})
		expect(response.headers['content-encoding']).toBeUndefined()
		expect(response.headers.vary).toBe('Accept-Encoding')
		expect(JSON.parse(response.body.toString())).toEqual(large)
	})

	test('a forced stream of a non-compressible type is compressed', async () => {
		const response = await get(port, '/ndjson', { 'Accept-Encoding': 'gzip' })
		expect(response.headers['content-encoding']).toBe('gzip')
		expect(response.headers['content-type']).toBe('application/x-ndjson')
		expect(gunzipSync(response.body).toString()).toBe(ndjson)
	})

	test('skips small, binary, opted-out, no-transform, already encoded, empty and HEAD responses', async () => {
		for (const path of ['/small', '/png', '/disabled', '/no-transform']) {
			const response = await get(port, path, { 'Accept-Encoding': 'gzip' })
			expect([path, response.headers['content-encoding']]).toEqual([path, undefined])
		}
		const encoded = await get(port, '/encoded', { 'Accept-Encoding': 'zstd, deflate' })
		expect(encoded.headers['content-encoding']).toBe('gzip')
		expect(gunzipSync(encoded.body).toString()).toBe('y'.repeat(2000))
		expect((await get(port, '/empty', { 'Accept-Encoding': 'gzip' })).headers['content-encoding']).toBeUndefined()
		const head = await get(port, '/large', { 'Accept-Encoding': 'gzip' }, 'HEAD')
		expect(head.headers['content-encoding']).toBeUndefined()
	})
})
