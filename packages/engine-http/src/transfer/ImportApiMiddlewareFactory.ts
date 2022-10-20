import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectInfoMiddlewareState } from '../project-common'
import { fromBuffer } from './CommandStream'
import { ImportError, ImportExecutor } from './ImportExecutor'
import { createGunzip } from 'zlib'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'

type ImportApiMiddlewareState =
	& TimerMiddlewareState
	& KoaRequestState
	& ProjectInfoMiddlewareState
	& { authResult: AuthResult }

export class ImportApiMiddlewareFactory {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly importExecutor: ImportExecutor,
	) {
	}

	create(): KoaMiddleware<ImportApiMiddlewareState> {
		return async koaContext => {
			const { request, response, state: { timer } } = koaContext

			const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
			koaContext.state.projectGroup = groupContainer.slug

			const authResult = await groupContainer.authenticator.authenticate({ request, timer })
			koaContext.state.authResult = authResult

			if (request.headers['content-type'] !== 'application/x-ndjson') {
				throw new HttpError(`Unsupported content type`, 400)
			}

			if (request.headers['content-encoding'] !== undefined && request.headers['content-encoding'] !== 'gzip') {
				throw new HttpError(`Unsupported content encoding`, 415)
			}

			response.headers['Content-Type'] = 'application/json'

			try {
				const isGzip = request.headers['content-encoding'] === 'gzip'
				const commands = fromBuffer(isGzip ? request.req.pipe(createGunzip()) : request.req)
				await this.importExecutor.import(groupContainer, authResult, commands)
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
