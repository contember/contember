import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { AuthResult, HttpError, LoggerMiddlewareState, LoggerRequestSymbol, TimerMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'
import { SystemGraphQLContextFactory } from './SystemGraphQLContextFactory'
import { withLogger } from '@contember/engine-common'

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
			koaContext.state.authResult = authResult

			const projectSlug = params.projectSlug

			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(projectSlug, { alias: true })

			if (projectContainer === undefined) {
				throw new HttpError(`Project ${projectSlug} NOT found`, 404)
			}

			const project = projectContainer.project
			koaContext.state.project = project.slug

			const requestLogger = projectContainer.logger.child({
				module: 'system',
				method: koaContext.request.method,
				url: koaContext.request.originalUrl,
				user: authResult.identityId,
				requestId: Math.random().toString().substring(2),
				[LoggerRequestSymbol]: koaContext.request,
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
			if (memberships.length === 0) {
				throw this.debug
					? new HttpError(`You are not allowed to access project ${project.slug}`, 403)
					: new HttpError(`Project ${project.slug} NOT found`, 404)
			}



			koaContext.state.logger = requestLogger

			const graphqlLogger = requestLogger.child()

			await withLogger(graphqlLogger, async () => {
				graphqlLogger.debug('System query processing started', {
					body: request.body,
					query: request.query,
				})
				const graphqlContext = await this.systemGraphqlContextFactory.create({
					authResult,
					memberships,
					koaContext,
					projectContainer,
					systemContainer: groupContainer.systemContainer,
					onClearCache: () => {
						projectContainer.contentSchemaResolver.clearCache()
						groupContainer.projectSchemaResolver.clearCache()
					},
				})
				const handler = groupContainer.systemGraphQLHandler

				await timer('GraphQL', () => handler({
					request,
					response,
					context: graphqlContext,
				}))
				graphqlLogger.debug('System query finished')
			})

		}
	}
}
