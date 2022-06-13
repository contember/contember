import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { Readable } from 'stream'
import { TenantRole } from '@contember/engine-tenant-api'
import { toBuffer } from './CommandStream'
import { ExportExecutor, ExportRequest } from './ExportExecutor'
import { ParseError } from '@contember/typesafe'
import { Logger } from '@contember/engine-common'
import { ProjectContainer } from '../ProjectContainer'

type ExportApiMiddlewareState =
	& TimerMiddlewareState
	& KoaRequestState
	& ProjectInfoMiddlewareState
	& { authResult: AuthResult }

export class ExportApiMiddlewareFactory {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly exportExecutor: ExportExecutor,
	) {
	}

	create(): KoaMiddleware<ExportApiMiddlewareState> {
		return async koaContext => {
			const { request, response, state: { timer } } = koaContext

			const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
			koaContext.state.projectGroup = groupContainer.slug

			const authResult = await groupContainer.authenticator.authenticate({ request, timer })
			koaContext.state.authResult = authResult

			if (!authResult.roles.includes(TenantRole.SUPER_ADMIN) && !authResult.roles.includes(TenantRole.PROJECT_ADMIN)) {
				throw new HttpError(`Not allowed`, 403)
			}

			let exportRequest: ExportRequest

			try {
				exportRequest = ExportRequest(request.body)

			} catch (e) {
				if (e instanceof ParseError) {
					response.status = 400
					response.headers['Content-Type'] = 'application/json'
					response.body = { ok: false, error: `Invalid request body: ${e.message}` }
					return

				} else {
					throw e
				}
			}

			// eslint-disable-next-line no-console
			const logger = new Logger(console.log)
			const projectContainers: Record<string, ProjectContainer> = {}

			for (const project of exportRequest.projects) {
				const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(project.slug, { alias: true, logger })

				if (projectContainer === undefined) {
					throw new HttpError(`Project ${project.slug} NOT found`, 400)
				}

				projectContainers[project.slug] = projectContainer
			}

			koaContext.compress = true
			response.status = 200
			response.res.setHeader('Content-Type', 'application/x-ndjson') // https://github.com/ndjson/ndjson-spec
			response.body = Readable.from(toBuffer(this.exportExecutor.export(exportRequest, projectContainers)))
		}
	}
}
