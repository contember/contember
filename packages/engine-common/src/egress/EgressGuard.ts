import { lookup as dnsLookup, LookupAddress } from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { LookupFunction } from 'node:net'
import { EgressError, EgressPolicy } from './EgressPolicy.js'

export interface EgressRequestInit {
	readonly method?: string
	readonly headers?: HeadersInit
	readonly body?: string
	readonly signal?: AbortSignal
	/** As in `fetch`: `follow` (the default) re-checks every hop against the policy. */
	readonly redirect?: 'follow' | 'manual' | 'error'
}

export type EgressFetch = (url: string, init: EgressRequestInit) => Promise<Response>

export interface EgressHttpOptions {
	readonly agent: http.Agent
	readonly lookup: LookupFunction
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const NULL_BODY_STATUSES = new Set([101, 103, 204, 205, 304])
const MAX_REDIRECTS = 20
const REQUEST_BODY_HEADERS = ['content-encoding', 'content-language', 'content-location', 'content-type']
const CREDENTIAL_HEADERS = ['authorization', 'proxy-authorization', 'cookie']

/**
 * Outgoing HTTP to URLs chosen by tenants (webhooks, identity providers), under an {@link EgressPolicy}. Built over
 * `node:http(s)` with dedicated agents and a per-request `lookup` that checks every resolved address before connecting:
 * the global agent reuses keep-alive sockets, Bun ignores an agent's `lookup`, and `fetch` takes no `lookup` at all.
 */
export class EgressGuard {
	private readonly lookup: LookupFunction
	private readonly httpsAgent: https.Agent
	private readonly httpAgent: http.Agent

	constructor(private readonly policy: EgressPolicy) {
		this.lookup = (hostname, options, callback) => {
			dnsLookup(hostname, { family: options.family ?? 0, hints: options.hints, all: true }, (err, addresses: LookupAddress[]) => {
				if (err) {
					callback(err, [])
					return
				}
				try {
					if (addresses.length === 0) {
						throw new EgressError(`${hostname} did not resolve`)
					}
					for (const address of addresses) {
						this.policy.checkAddress(hostname, address.address)
					}
				} catch (e) {
					callback(e instanceof Error ? e : new Error(String(e)), [])
					return
				}
				if (options.all) {
					callback(null, addresses)
				} else {
					callback(null, addresses[0].address, addresses[0].family)
				}
			})
		}
		this.httpsAgent = new https.Agent({ keepAlive: false, lookup: this.lookup })
		this.httpAgent = new http.Agent({ keepAlive: false, lookup: this.lookup })
	}

	/** Options for a client that issues its own `node:http(s)` requests; throws when the URL itself is not allowed. */
	public httpOptions(url: URL): EgressHttpOptions {
		this.policy.checkUrl(url)
		return {
			agent: url.protocol === 'https:' ? this.httpsAgent : this.httpAgent,
			lookup: this.lookup,
		}
	}

	/** A `fetch` subset that buffers the response body. Redirects follow `fetch` semantics, each hop re-checked. */
	public readonly fetch: EgressFetch = async (input, init) => {
		let url = this.parseUrl(input)
		let method = (init.method ?? 'GET').toUpperCase()
		let body = init.body
		const headers = new Headers(init.headers)
		for (let redirects = 0;; redirects++) {
			const response = await this.request(url, method, headers, body, init.signal)
			const location = response.headers.get('location')
			if (!REDIRECT_STATUSES.has(response.status) || location === null || init.redirect === 'manual') {
				return response
			}
			if (init.redirect === 'error') {
				throw new EgressError(`${url.origin} responded with a redirect`)
			}
			if (redirects >= MAX_REDIRECTS) {
				throw new EgressError(`Too many redirects from ${url.origin}`)
			}
			const next = this.parseUrl(location, url)
			if (
				((response.status === 301 || response.status === 302) && method === 'POST')
				|| (response.status === 303 && method !== 'GET' && method !== 'HEAD')
			) {
				method = 'GET'
				body = undefined
				for (const name of REQUEST_BODY_HEADERS) {
					headers.delete(name)
				}
			}
			if (next.origin !== url.origin) {
				for (const name of CREDENTIAL_HEADERS) {
					headers.delete(name)
				}
			}
			url = next
		}
	}

	public dispose(): void {
		this.httpsAgent.destroy()
		this.httpAgent.destroy()
	}

	private parseUrl(value: string, base?: URL): URL {
		let url: URL
		try {
			url = new URL(value, base)
		} catch {
			throw new EgressError('Invalid URL')
		}
		this.policy.checkUrl(url)
		return url
	}

	private request(url: URL, method: string, headers: Headers, body: string | undefined, signal: AbortSignal | undefined): Promise<Response> {
		return new Promise((resolve, reject) => {
			if (signal?.aborted) {
				reject(signal.reason)
				return
			}
			const outgoingHeaders: Record<string, string> = Object.fromEntries(headers.entries())
			if (body !== undefined) {
				outgoingHeaders['content-length'] = String(Buffer.byteLength(body))
			}
			const isHttps = url.protocol === 'https:'
			let settled = false
			const onAbort = () => fail(signal?.reason)
			const fail = (error: unknown) => {
				if (settled) {
					return
				}
				settled = true
				signal?.removeEventListener('abort', onAbort)
				req.destroy()
				reject(error)
			}
			const req = (isHttps ? https : http).request(url, {
				method,
				headers: outgoingHeaders,
				agent: isHttps ? this.httpsAgent : this.httpAgent,
				lookup: this.lookup,
			}, res => {
				const chunks: Buffer[] = []
				res.on('data', (chunk: Buffer) => chunks.push(chunk))
				res.on('error', fail)
				res.on('end', () => {
					if (settled) {
						return
					}
					try {
						const response = this.createResponse(res, Buffer.concat(chunks))
						settled = true
						signal?.removeEventListener('abort', onAbort)
						resolve(response)
					} catch (e) {
						fail(e)
					}
				})
			})
			signal?.addEventListener('abort', onAbort, { once: true })
			req.on('error', fail)
			req.end(body)
		})
	}

	private createResponse(res: http.IncomingMessage, body: Buffer): Response {
		const status = res.statusCode ?? 0
		if (status < 200 || status > 599) {
			throw new EgressError(`Unexpected HTTP status ${status}`)
		}
		const headers = new Headers()
		for (let i = 0; i + 1 < res.rawHeaders.length; i += 2) {
			headers.append(res.rawHeaders[i], res.rawHeaders[i + 1])
		}
		return new Response(NULL_BODY_STATUSES.has(status) ? null : new Uint8Array(body), {
			status,
			statusText: res.statusMessage ?? '',
			headers,
		})
	}
}
