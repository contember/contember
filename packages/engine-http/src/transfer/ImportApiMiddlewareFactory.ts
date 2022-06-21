import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { TenantRole } from '@contember/engine-tenant-api'
import { fromBuffer } from './CommandStream'
import { ImportError, ImportExecutor } from './ImportExecutor'
import { createGunzip } from 'zlib'

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

			if (!authResult.roles.includes(TenantRole.SUPER_ADMIN) && !authResult.roles.includes(TenantRole.PROJECT_ADMIN)) {
				throw new HttpError(`Not allowed`, 403)
			}

			if (request.headers['content-type'] !== 'application/x-ndjson') {
				throw new HttpError(`Unsupported content type`, 400)
			}

			try {
				const isGzip = request.headers['content-encoding'] === 'gzip'
				const commands = fromBuffer(isGzip ? request.req.pipe(createGunzip()) : request.req)
				await this.importExecutor.import(groupContainer, commands)
				response.status = 200
				response.headers['Content-Type'] = 'application/json'
				response.body = JSON.stringify({ ok: true })

			} catch (e) {
				if (e instanceof ImportError) {
					response.status = 400
					response.headers['Content-Type'] = 'application/json'
					response.body = JSON.stringify({ ok: false, error: e.message })

				} else {
					throw e
				}
			}
		}
	}
}
