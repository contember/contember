import { lookup as dnsLookup, LookupAddress } from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { LookupFunction } from 'node:net'
import { rootCertificates } from 'node:tls'
import { WorkloadIdentity } from '../../../type/index.js'
import { IssuerEgressPolicy } from './IssuerEgressPolicy.js'

export interface WorkloadIssuerFetchLimits {
	readonly timeoutMs: number
	readonly maxResponseBytes: number
	readonly maxRedirects: number
}

export const defaultWorkloadIssuerFetchLimits: WorkloadIssuerFetchLimits = {
	timeoutMs: 5_000,
	maxResponseBytes: 256 * 1024,
	maxRedirects: 3,
}

export class WorkloadIssuerFetchError extends Error {}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

/**
 * Fetches issuer discovery documents and JWKS under the §10.4 policy. Built over `node:http(s)` with dedicated agents:
 * the global agent reuses keep-alive sockets and skips `lookup`, which would bypass the per-connection address check.
 */
export class WorkloadIssuerFetcher {
	private readonly policy: IssuerEgressPolicy
	private readonly lookup: LookupFunction
	private readonly httpsAgent: https.Agent
	private readonly httpAgent: http.Agent
	private readonly ca: readonly string[]

	constructor(
		config: WorkloadIdentity.InstanceConfig,
		private readonly limits: WorkloadIssuerFetchLimits = defaultWorkloadIssuerFetchLimits,
	) {
		this.policy = new IssuerEgressPolicy(config)
		this.ca = [...rootCertificates, ...config.caCertificates]
		this.lookup = (hostname, options, callback) => {
			dnsLookup(hostname, { family: options.family ?? 0, hints: options.hints, all: true }, (err, addresses: LookupAddress[]) => {
				if (err) {
					callback(err, [])
					return
				}
				try {
					if (addresses.length === 0) {
						throw new WorkloadIssuerFetchError(`${hostname} did not resolve`)
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
		this.httpsAgent = new https.Agent({ keepAlive: false, lookup: this.lookup, ca: [...this.ca] })
		this.httpAgent = new http.Agent({ keepAlive: false, lookup: this.lookup })
	}

	/** GETs a JSON document, following at most `maxRedirects` redirects, each re-validated against the policy. */
	public async fetchJson(url: string): Promise<unknown> {
		const deadline = Date.now() + this.limits.timeoutMs
		let current = this.parseUrl(url)
		for (let redirects = 0;; redirects++) {
			const response = await this.request(current, deadline)
			if (response.type === 'body') {
				try {
					return JSON.parse(response.body.toString('utf8'))
				} catch {
					throw new WorkloadIssuerFetchError(`${current.origin} returned invalid JSON`)
				}
			}
			if (redirects >= this.limits.maxRedirects) {
				throw new WorkloadIssuerFetchError(`Too many redirects fetching ${this.describe(url)}`)
			}
			current = this.parseUrl(response.location, current)
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
			throw new WorkloadIssuerFetchError('Invalid issuer URL')
		}
		this.policy.checkUrl(url)
		return url
	}

	private describe(value: string): string {
		try {
			const url = new URL(value)
			return url.origin + url.pathname
		} catch {
			return 'an invalid URL'
		}
	}

	private request(url: URL, deadline: number): Promise<{ type: 'body'; body: Buffer } | { type: 'redirect'; location: string }> {
		return new Promise((resolve, reject) => {
			const remaining = deadline - Date.now()
			if (remaining <= 0) {
				reject(new WorkloadIssuerFetchError(`Timed out fetching ${url.origin}`))
				return
			}
			const isHttps = url.protocol === 'https:'
			const options: https.RequestOptions = {
				method: 'GET',
				agent: isHttps ? this.httpsAgent : this.httpAgent,
				lookup: this.lookup,
				headers: {
					'accept': 'application/json, application/jwk-set+json',
					'user-agent': 'contember-workload-identity',
				},
				...(isHttps ? { ca: [...this.ca] } : {}),
			}
			const req = (isHttps ? https : http).request(url, options, res => {
				const status = res.statusCode ?? 0
				if (REDIRECT_STATUSES.has(status)) {
					res.resume()
					const location = res.headers.location
					if (typeof location !== 'string' || location === '') {
						fail(new WorkloadIssuerFetchError(`${url.origin} redirected without a location`))
						return
					}
					done({ type: 'redirect', location })
					return
				}
				if (status !== 200) {
					res.resume()
					fail(new WorkloadIssuerFetchError(`${url.origin} responded with HTTP ${status}`))
					return
				}
				const declaredLength = Number(res.headers['content-length'])
				if (Number.isFinite(declaredLength) && declaredLength > this.limits.maxResponseBytes) {
					fail(new WorkloadIssuerFetchError(`${url.origin} response exceeds ${this.limits.maxResponseBytes} bytes`))
					return
				}
				const chunks: Buffer[] = []
				let size = 0
				res.on('data', (chunk: Buffer) => {
					size += chunk.length
					if (size > this.limits.maxResponseBytes) {
						fail(new WorkloadIssuerFetchError(`${url.origin} response exceeds ${this.limits.maxResponseBytes} bytes`))
						return
					}
					chunks.push(chunk)
				})
				res.on('end', () => done({ type: 'body', body: Buffer.concat(chunks) }))
				res.on('error', fail)
			})
			let settled = false
			const timer = setTimeout(() => fail(new WorkloadIssuerFetchError(`Timed out fetching ${url.origin}`)), remaining)
			const done = (value: { type: 'body'; body: Buffer } | { type: 'redirect'; location: string }) => {
				if (settled) {
					return
				}
				settled = true
				clearTimeout(timer)
				resolve(value)
			}
			const fail = (error: Error) => {
				if (settled) {
					return
				}
				settled = true
				clearTimeout(timer)
				req.destroy()
				reject(error instanceof WorkloadIssuerFetchError ? error : new WorkloadIssuerFetchError(`Fetching ${url.origin} failed: ${error.message}`))
			}
			req.on('error', fail)
			req.end()
		})
	}
}
