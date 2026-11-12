import { Stream, Transform } from 'node:stream'
import * as zlib from 'node:zlib'
import type * as Koa from 'koa'

declare module 'koa' {
	interface DefaultContext {
		/** `true` compresses a response whose type is not compressible by default, `false` never compresses it. */
		compress?: boolean
	}
}

type Encoding = 'zstd' | 'gzip' | 'deflate'

const compressors: Readonly<Record<Encoding, () => Transform>> = {
	zstd: () => zlib.createZstdCompress(),
	gzip: () => zlib.createGzip(),
	deflate: () => zlib.createDeflate(),
}

// zstd needs Node 22.15 or 23.8; a tie in quality goes to the first listed. Brotli stays off, as it was.
const offeredEncodings: readonly Encoding[] = typeof zlib.createZstdCompress === 'function' ? ['zstd', 'gzip', 'deflate'] : ['gzip', 'deflate']

type AcceptedEncoding = { readonly name: string; readonly quality: number }

const parseAcceptEncoding = (header: string): AcceptedEncoding[] =>
	header.split(',').flatMap(item => {
		const match = /^\s*([^\s;]+)\s*(?:;(.*))?$/.exec(item.trim())
		if (!match) {
			return []
		}
		const qualityParameter = (match[2] ?? '').split(';').map(it => it.trim().split('=')).find(([name]) => name === 'q')
		const quality = qualityParameter ? Number.parseFloat(qualityParameter[1]) : 1
		return [{ name: match[1].toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality }]
	})

/**
 * The best encoding the client accepts (RFC 9110 §12.5.3), or `undefined` for identity. An exact entry outranks `*`,
 * and identity, unless listed, is acceptable at the lowest quality given. No header means identity, a bare `*` gzip.
 */
export const negotiateEncoding = (header: string): Encoding | undefined => {
	if (header === '') {
		return undefined
	}
	if (header === '*') {
		return 'gzip'
	}
	const accepted = parseAcceptEncoding(header)
	const quality = (name: string): number | undefined => {
		const exact = accepted.filter(it => it.name === name)
		const matching = exact.length > 0 ? exact : accepted.filter(it => it.name === '*')
		return matching.length > 0 ? Math.max(...matching.map(it => it.quality)) : undefined
	}
	const identityQuality = quality('identity') ?? Math.min(1, ...accepted.map(it => it.quality || 1))
	let best: { encoding: Encoding | undefined; quality: number } = { encoding: undefined, quality: identityQuality > 0 ? identityQuality : 0 }
	for (const encoding of offeredEncodings) {
		const encodingQuality = quality(encoding) ?? 0
		// identity is the last preference, so an encoding wins a tie with it
		if (encodingQuality > 0 && (encodingQuality > best.quality || (encodingQuality === best.quality && best.encoding === undefined))) {
			best = { encoding, quality: encodingQuality }
		}
	}
	return best.encoding
}

const compressibleTypes: ReadonlySet<string> = new Set(['application/json', 'application/javascript', 'application/xml', 'application/wasm'])

/** The media types the engine serves as text: JSON, HTML, plain text, scripts, styles, SVG. */
export const isCompressibleType = (type: string): boolean => {
	const normalized = type.toLowerCase()
	return compressibleTypes.has(normalized) || /^text\/|\+(?:json|text|xml)$/.test(normalized)
}

const threshold = 1024
const emptyBodyStatuses: ReadonlySet<number> = new Set([204, 205, 304])
const noTransform = /(?:^|,)\s*?no-transform\s*?(?:,|$)/

const shouldCompress = (ctx: Koa.Context): boolean => {
	const response = ctx.response
	if (
		!ctx.body
		|| ctx.res.headersSent
		|| !ctx.writable
		|| ctx.compress === false
		|| ctx.method === 'HEAD'
		|| emptyBodyStatuses.has(response.status)
		|| response.get('Content-Encoding')
		|| !(ctx.compress === true || isCompressibleType(response.type))
		|| noTransform.test(response.get('Cache-Control'))
	) {
		return false
	}
	// a stream has no known length and is always compressed
	return response.length === undefined || response.length >= threshold
}

/** Compresses responses of 1 KiB and more, or of unknown length, with zstd, gzip or deflate, as the client accepts. */
export const createCompressionMiddleware = (): Koa.Middleware => async (ctx, next) => {
	ctx.vary('Accept-Encoding')
	await next()

	if (!shouldCompress(ctx)) {
		return
	}
	const encoding = negotiateEncoding(ctx.get('Accept-Encoding'))
	if (encoding === undefined) {
		return
	}
	const body: unknown = ctx.body
	const compressed = compressors[encoding]()
	ctx.set('Content-Encoding', encoding)
	ctx.res.removeHeader('Content-Length')
	ctx.body = compressed
	if (body instanceof Stream) {
		body.pipe(compressed)
	} else {
		compressed.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
	}
}
