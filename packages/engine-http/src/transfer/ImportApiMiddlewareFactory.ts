import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { fromBuffer } from './CommandStream'
import { ImportError, ImportExecutor } from './ImportExecutor'
import { createGunzip } from 'node:zlib'
import { pipeline, Readable } from 'node:stream'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'
import { Command } from './Command'

export const readImportCommands = (body: Readable, isGzip: boolean): AsyncIterable<Command> => {
	// pipe() would not pass on an aborted request, and the import would wait for the rest of the body forever;
	// pipeline() destroys the gunzip with the error, which rejects the read. The callback only satisfies the API.
	return fromBuffer(isGzip ? pipeline(body, createGunzip(), () => {}) : body)
}

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
				const commands = readImportCommands(request.req, isGzip)
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
