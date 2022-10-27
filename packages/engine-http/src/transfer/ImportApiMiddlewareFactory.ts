import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { fromBuffer } from './CommandStream'
import { ImportError, ImportExecutor } from './ImportExecutor'
import { createGunzip } from 'zlib'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'

export class ImportApiMiddlewareFactory {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly importExecutor: ImportExecutor,
	) {
	}

	create(): HttpController {
		return async ctx => {
			const { projectGroup, authResult, koa } = ctx
			const { request, response } = koa
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}

			if (request.headers['content-type'] !== 'application/x-ndjson') {
				throw new HttpErrorResponse(400, `Unsupported content type`)
			}

			if (request.headers['content-encoding'] !== undefined && request.headers['content-encoding'] !== 'gzip') {
				throw new HttpErrorResponse(415, `Unsupported content encoding`)
			}

			response.headers['Content-Type'] = 'application/json'

			try {
				const isGzip = request.headers['content-encoding'] === 'gzip'
				const commands = fromBuffer(isGzip ? request.req.pipe(createGunzip()) : request.req)
				await this.importExecutor.import(projectGroup, authResult, commands)
				response.status = 200
				response.body = { ok: true }

			} catch (e) {
				if (e instanceof ImportError) {
					response.status = 400
					response.body = { ok: false, error: e.message }

				} else {
					throw e
				}
			}
		}
	}
}
