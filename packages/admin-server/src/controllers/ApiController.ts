import { request as httpRequest, IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'
import { URL } from 'url'
import { BaseController } from './BaseController'
import type { S3Manager } from '../s3'
import type { TenantApi } from '../tenant'

interface ApiParams {
	path: string
}

export class ApiController extends BaseController<ApiParams> {
	constructor(private apiEndpoint: string, private tenant: TenantApi, private s3: S3Manager) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, params: ApiParams): Promise<void> {
		const token = this.readAuthCookie(req)
		const tokenPath = req.headers['x-contember-token-path']
		const apiEndpointUrl = new URL(this.apiEndpoint)

		const innerRequestOptions: RequestOptions = {
			protocol: apiEndpointUrl.protocol,
			hostname: apiEndpointUrl.hostname,
			port: apiEndpointUrl.port,
			path: apiEndpointUrl.pathname + params.path,
			method: req.method,
			headers: {
				Authorization: token && tokenPath === null ? `Bearer ${token}` : req.headers['authorization'],
				'Content-Type': req.headers['content-type'] ?? '',
			},
		}

		const driver = apiEndpointUrl.protocol === 'http:' ? httpRequest : httpsRequest
		req.pipe(
			driver(innerRequestOptions, async innerRes => {
				if (typeof tokenPath !== 'string') {
					this.proxyHead(res, innerRes)
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
					this.proxyHead(res, innerRes)
					res.end(rawBody)
					return
				}

				if (token === undefined || typeof jsonBody !== 'object' || jsonBody === null) {
					this.proxyHead(res, innerRes)
					res.end(rawBody)
					return
				}

				const accessibleProjects = await this.tenant.listAccessibleProjects(token)
				const projectsWithAdmin = new Set(await this.s3.listProjectSlugs())
				const projects = accessibleProjects.filter(it => projectsWithAdmin.has(it.slug))

				jsonBody['extensions'] ??= {}
				jsonBody['extensions']['contemberAdminServer'] = { projects }

				this.writeAuthCookie(res, token)
				this.proxyHead(res, innerRes)
				res.end(JSON.stringify(jsonBody))
			}),
		)

		return new Promise((resolve, reject) => {
			res.on('error', error => reject(error))
			res.on('finish', () => resolve())
		})
	}

	private extractToken(json: unknown, path: string[]): [any, string | undefined] {
		const [head, ...tail] = path

		if (head === undefined) {
			if (typeof json === 'string') {
				return ['__TOKEN_MOVED_TO_COOKIE__', json]
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

	private proxyHead(outerRes: ServerResponse, innerRes: IncomingMessage) {
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
