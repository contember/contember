import type { IncomingMessage, ServerResponse } from 'http'
import { readFile } from 'fs/promises'
import { getType } from 'mime'
import { BaseController } from './BaseController'
import { URL } from 'url'
import type { TenantApi } from '../tenant'
import type { S3Manager } from '../s3'

const CONTEMBER_CONFIG_PLACEHOLDER = '{configuration}'

export class LoginController extends BaseController {
	constructor(
		private apiEndpoint: string,
		private loginToken: string,
		private publicDir: string,
		private tenant: TenantApi,
		private s3: S3Manager
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
		const path = url.pathname === '/' ? 'index.html' : url.pathname.substring(1)
		const contentType = getType(path) ?? 'application/octet-stream'

		try {
			const content = await readFile(this.publicDir + '/' + path)
			res.setHeader('Content-Type', contentType)

			if (path === 'index.html') {
				const projects = await this.getProjects(this.readAuthCookie(req))
				const configJson = JSON.stringify({ apiBaseUrl: '/_api', loginToken: this.loginToken, projects })
				res.end(content.toString('utf8').replace(CONTEMBER_CONFIG_PLACEHOLDER, configJson))

			} else {
				res.end(content)
			}

		} catch (e) {
			res.writeHead(404)
			res.end()
		}
	}

	private async getProjects(token: string | null) {
		if (token === null) {
			return null
		}

		const accessibleProjects = await this.tenant.listAccessibleProjects(token)
		const projectsWithAdmin = new Set(await this.s3.listProjectSlugs())
		return accessibleProjects.filter(it => projectsWithAdmin.has(it.slug))
	}
}
