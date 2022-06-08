import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { ContentExporter } from './ContentExporter'
import { ContentImporter, ImportError } from './ContentImporter'
import { Logger } from '@contember/engine-common'
import { Readable } from 'stream'

type TransferApiMiddlewareState =
	& TimerMiddlewareState
	& KoaRequestState
	& ProjectInfoMiddlewareState
	& { authResult: AuthResult }

export class TransferApiMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly contentImporter: ContentImporter,
		private readonly contentExporter: ContentExporter,
	) {
	}

	create(kind: 'export' | 'import'): KoaMiddleware<TransferApiMiddlewareState> {
		return async koaContext => {
			const { request, response, state: { timer, params } } = koaContext

			const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
			koaContext.state.projectGroup = groupContainer.slug

			const authResult = await groupContainer.authenticator.authenticate({ request, timer })
			koaContext.state.authResult = authResult

			if (!authResult.roles.includes('superadmin')) {
				// TODO
			}

			const logger = new Logger(console.log)
			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(params.projectSlug, { alias: true, logger })

			if (projectContainer === undefined) {
				throw new HttpError(`Project ${params.projectSlug} NOT found`, 404)
			}

			const project = projectContainer.project
			koaContext.state.project = project.slug

			const systemDatabase = projectContainer.systemDatabaseContextFactory.create()
			const stage = await systemDatabase.queryHandler.fetch(new StageBySlugQuery(params.stageSlug))

			if (stage === null) {
				throw new HttpError(`Stage ${params.stageSlug} NOT found`, 404)
			}

			const schema = await projectContainer.contentSchemaResolver.getSchema(systemDatabase, params.stageSlug)
			const contentClient = projectContainer.connection.createClient(stage.schema, {})

			if (kind === 'export') {
				koaContext.compress = true
				response.status = 200
				response.headers['Content-Type'] = 'application/x-ndjson' // https://github.com/ndjson/ndjson-spec
				response.body = Readable.from(this.contentExporter.export(contentClient, schema))

			} else {
				try {
					await this.contentImporter.import(contentClient, response.req, schema)
					response.status = 200
					response.headers['Content-Type'] = 'application/json'
					response.body = { ok: true }

				} catch (e) {
					if (e instanceof ImportError) {
						response.status = 400
						response.headers['Content-Type'] = 'application/json'
						response.body = { ok: false, error: e.message }

					} else {
						throw e
					}
				}
			}
		}
	}
}
