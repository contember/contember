import { IncomingMessage, OutgoingHttpHeaders, request as httpRequest, ServerResponse } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'
import { TLSSocket } from 'tls'
import { ApiEndpointResolver } from '../services/ApiEndpointResolver'
import { readAuthCookie, writeAuthCookie } from '../utils/cookies'
import { isProxyRequest } from '../utils/forwared'
import { BaseController } from './BaseController'

export const LOGIN_TOKEN_PLACEHOLDER = '__LOGIN_TOKEN__'
export const SESSION_TOKEN_PLACEHOLDER = '__SESSION_TOKEN__'

const REQUEST_METHOD_WHITELIST = ['head', 'get', 'post'] // 'options' is intentionally excluded
const RESPONSE_HEADER_WHITELIST = ['content-type', 'x-contember-ref']

interface ApiParams {
	path: string
	projectGroup: string | undefined
}

export class ApiController extends BaseController<ApiParams> {
	constructor(
		private apiEndpointResolver: ApiEndpointResolver,
		private loginToken: string,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, params: ApiParams): Promise<void> {
		if (!REQUEST_METHOD_WHITELIST.includes(req.method?.toLowerCase() ?? '')) {
			res.writeHead(400)
			res.end()
			return
		}

		const tokenPath = req.headers['x-contember-token-path']
		const { endpoint, hostname } = this.apiEndpointResolver.resolve(params.projectGroup)

		const innerRequestOptions: RequestOptions = {
			protocol: endpoint.protocol,
			hostname: endpoint.hostname,
			port: endpoint.port,
			path: endpoint.pathname + params.path,
			method: req.method,
			setHost: false,
			headers: {
				...this.transformRequestHeaders(req),
				host: hostname,
			},
		}

		const driver = endpoint.protocol === 'http:' ? httpRequest : httpsRequest
		const innerReq = driver(innerRequestOptions, async innerRes => {
			if (typeof tokenPath !== 'string') {
				this.proxyResponseHead(res, innerRes)
				innerRes.pipe(res)
				return
			}

			const rawBody = await this.readRawBody(innerRes)
			const textBody = rawBody.toString('utf8')

			let jsonBody: any
			let token: string | undefined

			try {
				[jsonBody, token] = this.extractToken(JSON.parse(textBody), tokenPath.split('.'))

			} catch (e) {
				this.proxyResponseHead(res, innerRes)
				res.end(rawBody)
				return
			}

			if (token === undefined || typeof jsonBody !== 'object' || jsonBody === null) {
				this.proxyResponseHead(res, innerRes)
				res.end(rawBody)
				return
			}

			writeAuthCookie(req, res, token)
			this.proxyResponseHead(res, innerRes)
			res.end(JSON.stringify(jsonBody))
		})

		req.pipe(innerReq)

		return new Promise((resolve, reject) => {
			innerReq.on('error', reject)
			res.on('error', error => reject(error))
			res.on('finish', () => resolve())
		})
	}

	private transformRequestHeaders(req: IncomingMessage): OutgoingHttpHeaders {
		const outHeaders: OutgoingHttpHeaders = {}
		const bearerToken = this.readBearerToken(req)
		const cookieToken = readAuthCookie(req)
		const post = req.method?.toUpperCase() === 'POST'

		if (bearerToken === LOGIN_TOKEN_PLACEHOLDER) {
			if (post) {
				outHeaders['Authorization'] = `Bearer ${this.loginToken}`
			}

		} else if (bearerToken === SESSION_TOKEN_PLACEHOLDER || req.headers['authorization'] === undefined) {
			if (post && cookieToken !== null) {
				outHeaders['Authorization'] = `Bearer ${cookieToken}`
			}

		} else {
			outHeaders['Authorization'] = req.headers['authorization']
		}

		if (post && req.headers['content-type'] !== undefined) {
			outHeaders['Content-Type'] = req.headers['content-type']
		}

		if (isProxyRequest(req)) {
			outHeaders['X-Forwarded-For'] = req.headers['x-forwarded-for'] !== undefined
				? `${req.headers['x-forwarded-for']},${req.socket.remoteAddress}`
				: req.socket.remoteAddress

			outHeaders['X-Forwarded-Port'] = req.headers['x-forwarded-port'] ?? req.socket.remotePort
			outHeaders['X-Forwarded-Proto'] = req.headers['x-forwarded-proto'] ?? (req.socket instanceof TLSSocket && req.socket.encrypted ? 'https' : 'http')
		}

		return outHeaders
	}

	private extractToken(json: unknown, path: string[]): [any, string | undefined] {
		const [head, ...tail] = path

		if (head === undefined) {
			if (typeof json === 'string') {
				return [SESSION_TOKEN_PLACEHOLDER, json]
			} else {
				return [json, undefined]
			}
		}

		if (json instanceof Object && json.constructor === Object && head in json) {
			const [innerJson, innerToken] = this.extractToken((json as any)[head], tail)
			return [{ ...json, [head]: innerJson }, innerToken]
		}

		return [json, undefined]
	}

	private proxyResponseHead(outerRes: ServerResponse, innerRes: IncomingMessage) {
		const outHeaders: OutgoingHttpHeaders = {}

		for (const headerName of RESPONSE_HEADER_WHITELIST) {
			if (innerRes.headers[headerName]) {
				outHeaders[headerName] = innerRes.headers[headerName]
			}
		}

		outerRes.writeHead(innerRes.statusCode ?? 200, innerRes.statusMessage, outHeaders)
	}
}
