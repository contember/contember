import { HttpController } from '../application'
import { ProjectContextResolver } from '../project-common'
import { HttpErrorResponse } from '../common'
import { SystemGraphQLContextFactory } from './SystemGraphQLContextFactory'
import { GraphQLKoaState } from '../graphql'


export class SystemApiMiddlewareFactory {
	constructor(
		private readonly debug: boolean,
		private readonly systemGraphqlContextFactory: SystemGraphQLContextFactory,
		private readonly projectContextResolver: ProjectContextResolver,
	) {
	}

	create(): HttpController {
		return async context => {
			const { timer, projectGroup, authResult, koa } = context
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			const { projectContainer, project } = await this.projectContextResolver.resolve(context)

			const logger = context.logger.child({
				project: project.slug,
			})

			const tenantContainer = projectGroup.tenantContainer
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
			logger.debug('Memberships fetched', { memberships })

			if (memberships.length === 0) {
				throw this.debug
					? new HttpErrorResponse(403, `You are not allowed to access project ${project.slug}`)
					: new HttpErrorResponse(404, `Project ${project.slug} NOT found`)
			}

			await logger.scope(async logger => {
				logger.debug('System query processing started')
				const graphqlContext = await this.systemGraphqlContextFactory.create({
					authResult,
					memberships,
					projectContainer,
					systemContainer: projectGroup.systemContainer,
					onClearCache: () => {
						projectContainer.contentSchemaResolver.clearCache()
					},
				})
				const handler = projectGroup.systemGraphQLHandler

				await timer('GraphQL', () => handler({
					request: koa.request,
					response: koa.response,
					createContext: ({ operation }) => {
						(koa.state as GraphQLKoaState).graphql = {
							operationName: operation,
						}

						return graphqlContext
					},
				}))
				logger.debug('System query finished')
			})
		}
	}
}
