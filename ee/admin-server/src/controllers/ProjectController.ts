import { BaseController } from './BaseController'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TenantClient } from '../services/TenantClient'
import type { S3Manager } from '../services/S3Manager'
import { Readable } from 'stream'
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { readAuthCookie } from '../utils/cookies'

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
			res.setHeader('Location', '/')
			res.writeHead(302)
			res.end()
			return
		}

		try {
			const innerRes = await this.tryFiles(params.projectSlug, params.projectGroup, params.path)

			if (innerRes.Body instanceof Readable) {
				res.setHeader('Content-Type', innerRes.ContentType ?? 'application/octet-stream')
				innerRes.Body.pipe(res)

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
		return await this.s3.getObject({ project, projectGroup, path: path.includes('.') ? path : 'index.html' })
	}
}
