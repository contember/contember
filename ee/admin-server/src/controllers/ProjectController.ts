import { BaseController } from './BaseController'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TenantClient } from '../services/TenantClient'
import type { S3Manager } from '../services/S3Manager'
import { Readable } from 'stream'
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { readAuthCookie } from '../utils/cookies'
import { readReadable } from '../utils/readReadable'

interface ProjectParams {
	projectSlug: string
	path: string
	projectGroup: string | undefined
}

export class ProjectController extends BaseController<ProjectParams> {
	constructor(
		private tenant: TenantClient,
		private s3: S3Manager,
	) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, params: ProjectParams): Promise<void> {
		const token = readAuthCookie(req)

		if (token === null || !(await this.tenant.hasProjectAccess(token, params.projectSlug, params.projectGroup))) {
			const params = new URLSearchParams({ backlink: req.url! })
			res.setHeader('Location', '/?' + params.toString())
			res.writeHead(302)
			res.end()
			return
		}

		try {
			const path = params.path.includes('.') ? params.path : 'index.html'
			const innerRes = await this.tryFiles(params.projectSlug, params.projectGroup, path)
			if (innerRes.Body instanceof Readable) {
				res.setHeader('Content-Type', innerRes.ContentType ?? 'application/octet-stream')
				if (path === 'index.html') {
					const html = await readReadable(innerRes.Body)
					const processedHtml = this.preprocessIndexHtml(html, params)
					res.end(processedHtml)
				} else {
					innerRes.Body.pipe(res)
				}
			} else {
				res.writeHead(500)
				res.end()
			}

		} catch (e) {
			res.writeHead(404)
			res.end()
		}
	}

	private async tryFiles(project: string, projectGroup: string | undefined, path: string): Promise<GetObjectCommandOutput> {
		return await this.s3.getObject({ project, projectGroup, path })
	}

	private preprocessIndexHtml(html: string, params: ProjectParams): string {
		return html.replaceAll(/(src|href)="\.\//g, ((substring, attrName) => {
			return `${attrName}="/${params.projectSlug}/`
		}))
	}
}
