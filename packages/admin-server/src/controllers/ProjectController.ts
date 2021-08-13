import { BaseController } from './BaseController'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TenantApi } from '../tenant'
import type { S3Manager } from '../s3'
import { Readable } from 'stream'
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'

interface ProjectParams {
	projectSlug: string
	path: string
}

export class ProjectController extends BaseController<ProjectParams> {
	constructor(private tenant: TenantApi, private s3: S3Manager) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse, params: ProjectParams): Promise<void> {
		const token = this.readAuthCookie(req)

		if (token === null || !(await this.tenant.hasProjectAccess(token, params.projectSlug))) {
			res.setHeader('Location', '/')
			res.writeHead(302)
			res.end()
			return
		}

		try {
			const innerRes = await this.tryFiles(params.projectSlug, params.path)

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

	private async tryFiles(projectSlug: string, path: string): Promise<GetObjectCommandOutput> {
		try {
			return this.s3.getObject(projectSlug, path === '' ? 'index.html' : path)

		} catch (e) {
			return this.s3.getObject(projectSlug, 'index.html')
		}
	}
}
