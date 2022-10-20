import { KoaMiddleware, KoaRequestState } from '../koa'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { ProjectInfoMiddlewareState } from '../project-common'
import { Readable } from 'stream'
import { toBuffer } from './CommandStream'
import { ExportExecutor, ExportRequest } from './ExportExecutor'
import { ParseError } from '@contember/typesafe'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'
import { ProjectContainer } from '../project'

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

			const projectContainers: Record<string, ProjectContainer> = {}

			for (const project of exportRequest.projects) {
				const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(project.slug, { alias: true })

				if (projectContainer === undefined) {
					throw new HttpError(`Project ${project.slug} NOT found`, 400)
				}

				const systemContext = projectContainer.systemDatabaseContextFactory.create()
				const schema = await projectContainer.contentSchemaResolver.getSchema(systemContext, project.slug)
				const { effective: memberships } = await timer('MembershipFetch', () => groupContainer.projectMembershipResolver.resolveMemberships({
					request: { get: () => '' },
					acl: schema.acl,
					projectSlug: project.slug,
					identity: {
						identityId: authResult.identityId,
						roles: authResult.roles,
					},
				}))

				const projectRoles = memberships.map(it => it.role)

				if (!projectRoles.some(role => schema.acl.roles[role]?.content?.export)) {
					throw new HttpError(`Not allowed`, 403)
				}

				if (project.system && !projectRoles.some(role => schema.acl.roles[role]?.system?.export)) {
					throw new HttpError(`Not allowed`, 403)
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
