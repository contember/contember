import { request as httpRequest, IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'
import { URL } from 'url'
import { BaseController } from './BaseController'
import type { ProjectListProvider } from '../project'

export const LOGIN_TOKEN_PLACEHOLDER = '__LOGIN_TOKEN__'
export const SESSION_TOKEN_PLACEHOLDER = '__SESSION_TOKEN__'

interface ApiParams {
	path: string
}

export class ApiController extends BaseController<ApiParams> {
	constructor(
		private apiEndpoint: string,
		private loginToken: string,
		private projectListProvider: ProjectListProvider,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, params: ApiParams): Promise<void> {
		const tokenPath = req.headers['x-contember-token-path']
		const apiEndpointUrl = new URL(this.apiEndpoint)

		const innerRequestOptions: RequestOptions = {
			protocol: apiEndpointUrl.protocol,
			hostname: apiEndpointUrl.hostname,
			port: apiEndpointUrl.port,
			path: apiEndpointUrl.pathname + params.path,
			method: req.method,
			headers: this.transformIncomingHeaders(req),
		}

		const driver = apiEndpointUrl.protocol === 'http:' ? httpRequest : httpsRequest
		req.pipe(
			driver(innerRequestOptions, async innerRes => {
				if (typeof tokenPath !== 'string') {
					this.proxyOugoingHead(res, innerRes)
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
					this.proxyOugoingHead(res, innerRes)
					res.end(rawBody)
					return
				}

				if (token === undefined || typeof jsonBody !== 'object' || jsonBody === null) {
					this.proxyOugoingHead(res, innerRes)
					res.end(rawBody)
					return
				}

				jsonBody['extensions'] ??= {}
				jsonBody['extensions']['contemberAdminServer'] = { projects: await this.projectListProvider.get(token) }

				this.writeAuthCookie(res, token)
				this.proxyOugoingHead(res, innerRes)
				res.end(JSON.stringify(jsonBody))
			}),
		)

		return new Promise((resolve, reject) => {
			res.on('error', error => reject(error))
			res.on('finish', () => resolve())
		})
	}

	private transformIncomingHeaders(req: IncomingMessage): OutgoingHttpHeaders {
		const outHeaders: OutgoingHttpHeaders = {}
		const bearerToken = this.readBearerToken(req)
		const cookieToken = this.readAuthCookie(req)

		if (bearerToken === LOGIN_TOKEN_PLACEHOLDER) {
			outHeaders['Authorization'] = `Bearer ${this.loginToken}`

		} else if (bearerToken === SESSION_TOKEN_PLACEHOLDER || req.headers['authorization'] === undefined) {
			if (cookieToken !== null) {
				outHeaders['Authorization'] = `Bearer ${cookieToken}`
			}

		} else {
			outHeaders['Authorization'] = req.headers['authorization']
		}

		if (req.headers['content-type'] !== undefined) {
			outHeaders['Content-Type'] = req.headers['content-type']
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

	private proxyOugoingHead(outerRes: ServerResponse, innerRes: IncomingMessage) {
		const headerWhitelist = new Set(['content-type', 'x-contember-ref'])
		const outHeaders: OutgoingHttpHeaders = {}

		for (const headerName in innerRes.headers) {
			if (headerWhitelist.has(headerName)) {
				outHeaders[headerName] = innerRes.headers[headerName]
			}
		}

		outerRes.writeHead(innerRes.statusCode ?? 200, innerRes.statusMessage, outHeaders)
	}
}
