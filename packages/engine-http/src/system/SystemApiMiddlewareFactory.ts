import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectContextResolver, ProjectInfoMiddlewareState } from '../project-common'
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
		private readonly systemGraphqlContextFactory: SystemGraphQLContextFactory,
		private readonly projectContextResolver: ProjectContextResolver,
	) {
	}

	create(): KoaMiddleware<SystemApiMiddlewareKoaState> {
		return async koaContext => {
			const { request, response, state: { timer } } = koaContext
			const { groupContainer, projectContainer, requestLogger, project, authResult } = await this.projectContextResolver.resolve(koaContext)


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
