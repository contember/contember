import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { AuthResult, HttpError, LoggerMiddlewareState, TimerMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'
import { SystemGraphQLContextFactory } from './SystemGraphQLContextFactory'

type SystemApiMiddlewareKoaState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
	& LoggerMiddlewareState
	& { authResult: AuthResult }

export class SystemApiMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly systemGraphqlContextFactory: SystemGraphQLContextFactory,
	) {
	}

	create(): KoaMiddleware<SystemApiMiddlewareKoaState> {
		return async koaContext => {
			const { request, response, state: { timer, params } } = koaContext
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

			const project = projectContainer.project
			koaContext.state.project = project.slug

			const requestLogger = koaContext.state.logger.child({
				...projectContainer.logger.attributes,
				module: 'system',
				user: authResult.identityId,
			})

			const tenantContainer = groupContainer.tenantContainer
			const memberships = await timer('MembershipFetch', () =>
				tenantContainer.projectMemberManager.getEffectiveProjectMemberships(
					tenantContainer.databaseContext,
					{ slug: project.slug },
					{
						id: authResult.identityId,
						roles: authResult.roles,
					},
				),
			)
			requestLogger.debug('Memberships fetched', { memberships })

			if (memberships.length === 0) {
				throw this.debug
					? new HttpError(`You are not allowed to access project ${project.slug}`, 403)
					: new HttpError(`Project ${project.slug} NOT found`, 404)
			}


			koaContext.state.logger = requestLogger

			await requestLogger.scope(async logger => {
				logger.debug('System query processing started')
				const graphqlContext = await this.systemGraphqlContextFactory.create({
					authResult,
					memberships,
					koaContext,
					projectContainer,
					systemContainer: groupContainer.systemContainer,
					onClearCache: () => {
						projectContainer.contentSchemaResolver.clearCache()
					},
				})
				const handler = groupContainer.systemGraphQLHandler

				await timer('GraphQL', () => handler({
					request,
					response,
					createContext: () => graphqlContext,
				}))
				logger.debug('System query finished')
			})
		}
	}
}
