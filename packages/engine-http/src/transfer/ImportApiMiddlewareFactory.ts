import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { TenantRole } from '@contember/engine-tenant-api'
import { fromBuffer, toBuffer } from './CommandStream'
import { ImportExecutor } from './ImportExecutor'
import { createGunzip } from 'zlib'
import { Readable } from 'stream'

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

			if (request.headers['content-encoding'] !== undefined && request.headers['content-encoding'] !== 'gzip') {
				throw new HttpError(`Unsupported content encoding`, 415)
			}

			const isGzip = request.headers['content-encoding'] === 'gzip'
			const commands = fromBuffer(isGzip ? request.req.pipe(createGunzip()) : request.req)

			response.status = 200
			response.headers['Content-Type'] = 'application/x-ndjson'
			response.body = Readable.from(toBuffer(this.importExecutor.import(groupContainer, commands), 0))
		}
	}
}
