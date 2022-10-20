import { AuthResult, HttpError, LoggerMiddlewareState, TimerMiddlewareState } from '../common'
import { KoaContext, KoaRequestState } from '../koa'
import { ProjectInfoMiddlewareState } from './ProjectInfoMiddlewareState'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'

export type ProjectContextResolverState =
	& TimerMiddlewareState
	& KoaRequestState
	& ProjectInfoMiddlewareState
	& LoggerMiddlewareState
	& { authResult: AuthResult }


export class ProjectContextResolver {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
	) {
	}

	async resolve(koaContext: KoaContext<ProjectContextResolverState>) {
		const { request, state: { timer, params } } = koaContext
		const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
		koaContext.state.projectGroup = groupContainer.slug

		const authResult = await groupContainer.authenticator.authenticate({ request, timer })
		koaContext.state.logger.debug('User authenticated', { authResult })
		koaContext.state.authResult = authResult

		const projectSlug = params.projectSlug
		const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(projectSlug, { alias: true })

		if (projectContainer === undefined) {
			throw new HttpError(`Project ${projectSlug} NOT found`, 404)
		}
		const requestLogger = koaContext.state.logger.child({
			...projectContainer.logger.attributes,
			module: 'system',
			user: authResult.identityId,
		})
		koaContext.state.logger = requestLogger

		const project = projectContainer.project
		koaContext.state.project = project.slug
		return { requestLogger, groupContainer, projectContainer, project, authResult }
	}
}
