import { KoaMiddleware, KoaRequestState } from '../koa/index.js'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common/index.js'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common/index.js'
import { GraphQLKoaState } from '../graphql/index.js'
import { SystemGraphQLContextFactory } from './SystemGraphQLContextFactory.js'
import { Logger } from '@contember/engine-common'

type SystemApiMiddlewareKoaState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
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
			// eslint-disable-next-line no-console
			const logger = new Logger(console.log)
			logger.group(`Initializing ${groupContainer.slug}/${params.projectSlug}`)
			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(projectSlug, {
				alias: true,
				logger,
			})
			logger.groupEnd()
			if (projectContainer === undefined) {
				throw new HttpError(`Project ${projectSlug} NOT found`, 404)
			}
			const project = projectContainer.project
			koaContext.state.project = project.slug

			const tenantContainer = groupContainer.tenantContainer
			const memberships = await timer('MembershipFetch', () =>
				tenantContainer.projectMemberManager.getProjectMemberships(
					tenantContainer.databaseContext,
					{ slug: project.slug },
					{
						id: authResult.identityId,
						roles: authResult.roles,
					},
					undefined,
				),
			)
			if (memberships.length === 0) {
				throw this.debug
					? new HttpError(`You are not allowed to access project ${project.slug}`, 403)
					: new HttpError(`Project ${project.slug} NOT found`, 404)
			}


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
		}
	}
}
