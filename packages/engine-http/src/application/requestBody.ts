import { IncomingMessage } from 'node:http'
import { Readable, Transform } from 'node:stream'
import { createBrotliDecompress, createUnzip } from 'node:zlib'
import { KoaContext, KoaMiddleware } from './types.js'

declare module 'koa' {
	interface Request {
		/** The parsed JSON or form body; `{}` for any other content type. */
		body?: unknown
	}
}

const byteUnits: Readonly<Record<string, number>> = {
	b: 1,
	kb: 1024,
	mb: 1024 ** 2,
	gb: 1024 ** 3,
	tb: 1024 ** 4,
	pb: 1024 ** 5,
}

/** `1048576`, `512kb`, `1.5 MB`: binary units, as `requestBodySize` has always been read. `undefined` when invalid. */
export const parseByteSize = (value: string): number | undefined => {
	const match = /^(\d+(?:\.\d+)?) *(b|kb|mb|gb|tb|pb)?$/i.exec(value.trim())
	if (!match) {
		return undefined
	}
	const bytes = Math.floor(Number(match[1]) * byteUnits[(match[2] ?? 'b').toLowerCase()])
	return Number.isSafeInteger(bytes) ? bytes : undefined
}

const jsonTypes: ReadonlySet<string> = new Set([
	'application/json',
	'application/json-patch+json',
	'application/vnd.api+json',
	'application/csp-report',
	'application/scim+json',
])
const formType = 'application/x-www-form-urlencoded'

const mediaTypePattern = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/
const mediaTypeParameterPattern =
	/; *[!#$%&'*+\-.0-9A-Z^_`a-z|~]+ *= *(?:"(?:[ !\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\x20-\x7e])*"|[!#$%&'*+\-.0-9A-Z^_`a-z|~]+) */y

/** The lower-cased `type/subtype` of a well-formed Content-Type header; a malformed one matches no parser. */
export const parseMediaType = (header: string): string | undefined => {
	// clients commonly send a trailing `;`, e.g. `application/json;`
	const value = header.replace(/;$/, '')
	const separator = value.indexOf(';')
	const match = mediaTypePattern.exec(separator === -1 ? value : value.slice(0, separator))
	if (!match) {
		return undefined
	}
	if (separator !== -1) {
		mediaTypeParameterPattern.lastIndex = separator
		while (mediaTypeParameterPattern.lastIndex < value.length) {
			if (!mediaTypeParameterPattern.test(value)) {
				return undefined
			}
		}
	}
	return `${match[1]}/${match[2]}`.toLowerCase()
}

type BodyReadFailure = { readonly status: 400 | 413 | 415 | 500; readonly message?: string }

class BodyReadError extends Error {
	constructor(readonly failure: BodyReadFailure) {
		super(failure.message ?? `HTTP ${failure.status}`)
	}
}

const tooLarge: BodyReadFailure = { status: 413, message: 'request entity too large' }
const aborted: BodyReadFailure = { status: 400, message: 'request aborted' }

const createDecompressor = (encoding: string): Transform | undefined => {
	switch (encoding) {
		case 'identity':
			return undefined
		case 'gzip':
		case 'deflate':
			return createUnzip()
		case 'br':
			return createBrotliDecompress()
		default:
			throw new BodyReadError({ status: 415 })
	}
}

/** Compressed data can be a little larger than what it inflates to (stored blocks, headers), never by much. */
const compressedLimit = (limit: number): number => limit + Math.ceil(limit / 1024) + 1024

/**
 * Reads the body as UTF-8 text. `limit` caps the decompressed size, so a compressed body cannot expand past it, and the
 * bytes received, so one cannot send endless input that inflates to nothing. On a failure the request is left paused
 * and unread, as before.
 */
export const readRequestText = (request: IncomingMessage, limit: number): Promise<string> => {
	const encoding = request.headers['content-encoding'] ?? 'identity'
	const contentLength = request.headers['content-length'] !== undefined ? Number(request.headers['content-length']) : undefined
	const wireLimit = encoding === 'identity' ? limit : compressedLimit(limit)
	if (contentLength !== undefined && contentLength > wireLimit) {
		return Promise.reject(new BodyReadError(tooLarge))
	}
	const declaredLength = encoding === 'identity' ? contentLength : undefined
	// a consumed or closed request emits nothing more, so waiting for it would never settle
	if (request.readableEnded) {
		return Promise.reject(new BodyReadError({ status: 500, message: 'request body was already read' }))
	}
	if (request.destroyed || request.readableAborted || !request.readable) {
		return Promise.reject(new BodyReadError(aborted))
	}
	let decompressor: Transform | undefined
	try {
		decompressor = createDecompressor(encoding)
	} catch (error) {
		return Promise.reject(error)
	}
	const source: Readable = decompressor ? request.pipe(decompressor) : request

	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		let received = 0
		let receivedCompressed = 0
		let settled = false

		const cleanup = () => {
			source.off('data', onData)
			source.off('end', onEnd)
			source.off('error', onSourceError)
			request.off('data', onCompressedData)
			request.off('error', onAborted)
			request.off('close', onClose)
		}
		const fail = (failure: BodyReadFailure) => {
			if (settled) {
				return
			}
			settled = true
			cleanup()
			if (decompressor) {
				request.unpipe(decompressor)
				decompressor.destroy()
			}
			source.pause()
			reject(new BodyReadError(failure))
		}
		const onData = (chunk: Buffer) => {
			received += chunk.length
			if (received > limit) {
				fail(tooLarge)
			} else {
				chunks.push(chunk)
			}
		}
		const onCompressedData = (chunk: Buffer) => {
			receivedCompressed += chunk.length
			if (receivedCompressed > wireLimit) {
				fail(tooLarge)
			}
		}
		const onEnd = () => {
			if (declaredLength !== undefined && received !== declaredLength) {
				fail({ status: 400, message: 'request size did not match content length' })
				return
			}
			settled = true
			cleanup()
			// strips a UTF-8 BOM and replaces invalid sequences, as the previous parser did
			resolve(new TextDecoder().decode(Buffer.concat(chunks)))
		}
		const onSourceError = () => fail(decompressor === undefined ? aborted : { status: 400, message: 'request body could not be decompressed' })
		const onAborted = () => fail(aborted)
		const onClose = () => {
			if (!request.complete) {
				fail(aborted)
			}
		}

		source.on('data', onData)
		source.on('end', onEnd)
		source.on('error', onSourceError)
		if (decompressor) {
			request.on('data', onCompressedData)
		}
		request.on('error', onAborted)
		request.on('close', onClose)
	})
}

const strictJsonStart = /^[ \t\n\r]*[[{]/
// any spelling of a `"__proto__":` key, escapes included; only then is the parsed value scanned
const suspectProtoKey =
	/"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/

const hasOwnProtoKey = (root: object): boolean => {
	const pending: object[] = [root]
	for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
		if (Object.hasOwn(node, '__proto__')) {
			return true
		}
		for (const value of Object.values(node)) {
			if (typeof value === 'object' && value !== null) {
				pending.push(value)
			}
		}
	}
	return false
}

type JsonParseResult = { readonly ok: true; readonly value: unknown } | { readonly ok: false }

/** Only an object or an array, and no `__proto__` key anywhere (prototype poisoning). An empty body is `{}`. */
export const parseJsonBody = (text: string): JsonParseResult => {
	if (text === '') {
		return { ok: true, value: {} }
	}
	if (!strictJsonStart.test(text)) {
		return { ok: false }
	}
	let value: unknown
	try {
		value = JSON.parse(text)
	} catch {
		return { ok: false }
	}
	if (typeof value === 'object' && value !== null && suspectProtoKey.test(text) && hasOwnProtoKey(value)) {
		return { ok: false }
	}
	return { ok: true, value }
}

const maxFormParameters = 1000

/**
 * Flat `application/x-www-form-urlencoded`: a repeated key collects its values into an array. Only the first 1000
 * pairs are read, and keys naming an `Object.prototype` member (`__proto__`, `constructor`, …) are dropped.
 */
export const parseFormBody = (text: string): Record<string, string | string[]> => {
	const result: Record<string, string | string[]> = {}
	let count = 0
	for (const [key, value] of new URLSearchParams(text)) {
		if (++count > maxFormParameters) {
			break
		}
		if (key === '' || Object.hasOwn(Object.prototype, key)) {
			continue
		}
		const existing = result[key]
		result[key] = existing === undefined ? value : [...(Array.isArray(existing) ? existing : [existing]), value]
	}
	return result
}

export const defaultJsonBodyLimit = 1024 ** 2
export const defaultFormBodyLimit = 56 * 1024

/** Bytes after decompression. */
export interface RequestBodyLimits {
	readonly json: number
	readonly form: number
}

const parseBody = async (ctx: KoaContext<unknown>, limits: RequestBodyLimits): Promise<unknown> => {
	const type = parseMediaType(ctx.get('Content-Type'))
	if (type !== undefined && jsonTypes.has(type)) {
		const parsed = parseJsonBody(await readRequestText(ctx.req, limits.json))
		return parsed.ok ? parsed.value : ctx.throw(400)
	}
	if (type === formType) {
		return parseFormBody(await readRequestText(ctx.req, limits.form))
	}
	return {}
}

/**
 * Parses JSON and form bodies into `ctx.request.body`, unless an earlier middleware set it. Other content types are not
 * read, so a handler can still stream the request (the import API reads `application/x-ndjson` itself).
 */
export const createRequestBodyMiddleware = (limits: RequestBodyLimits): KoaMiddleware<unknown> => async (ctx, next) => {
	if (ctx.request.body !== undefined) {
		return await next()
	}
	try {
		ctx.request.body = await parseBody(ctx, limits)
	} catch (error) {
		if (error instanceof BodyReadError) {
			const { status, message } = error.failure
			// without a message the response carries the status text, e.g. `Unsupported Media Type`
			return message === undefined ? ctx.throw(status) : ctx.throw(status, message)
		}
		throw error
	}
	await next()
}
