import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { AuthResult, HttpError, LoggerMiddlewareState, TimerMiddlewareState } from '../common'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { NotModifiedChecker } from './NotModifiedChecker'
import { ContentGraphQLContextFactory } from './ContentGraphQLContextFactory'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory'
import { GraphQLSchema } from 'graphql'
import { GraphQLKoaState } from '../graphql'

type ContentApiMiddlewareKoaState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
	& LoggerMiddlewareState
	& {
		authResult: AuthResult
	}


const debugHeader = 'x-contember-debug'

export class ContentApiMiddlewareFactory {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly notModifiedChecker: NotModifiedChecker,
		private readonly contentGraphqlContextFactory: ContentGraphQLContextFactory,
		private readonly handlerFactory: ContentQueryHandlerFactory,
	) {
	}

	create(): KoaMiddleware<ContentApiMiddlewareKoaState> {
		const handlerCache = new WeakMap<GraphQLSchema, ContentQueryHandler>()

		return async koaContext => {
			const { request, response, state: { timer, params } } = koaContext
			const groupContainer = await this.projectGroupResolver.resolveContainer({ request })
			koaContext.state.projectGroup = groupContainer.slug

			const authResult = await groupContainer.authenticator.authenticate({ request, timer })
			koaContext.state.logger.debug('User authenticated', { authResult })
			koaContext.state.authResult = authResult


			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(params.projectSlug, {
				alias: true,
			})

			if (projectContainer === undefined) {
				throw new HttpError(`Project ${params.projectSlug} NOT found`, 404)
			}
			const requestLogger = koaContext.state.logger.child({
				...projectContainer.logger.attributes,
				module: 'content',
				user: authResult.identityId,
			})
			koaContext.state.logger = requestLogger

			const project = projectContainer.project
			koaContext.state.project = project.slug

			const systemDatabase = projectContainer.systemDatabaseContextFactory.create()
			const stage = await systemDatabase.queryHandler.fetch(new StageBySlugQuery(params.stageSlug))
			if (!stage) {
				throw new HttpError(`Stage ${params.stageSlug} NOT found`, 404)
			}
			const notModifiedRes = await this.notModifiedChecker.checkNotModified({
				request,
				timer,
				systemDatabase,
				stageId: stage.id,
			})
			if (notModifiedRes?.isModified === false) {
				response.status = 304
				return
			}

			const schema = await projectContainer.contentSchemaResolver.getSchema(systemDatabase, stage.slug)

			const { effective: memberships, fetched: fetchedMemberships } = await timer(
				'MembershipFetch',
				() => groupContainer.projectMembershipResolver.resolveMemberships({
					request,
					acl: schema.acl,
					projectSlug: project.slug,
					identity: {
						identityId: authResult.identityId,
						personId: authResult.personId ?? undefined,
						roles: authResult.roles,
					},
				}),
			)
			requestLogger.debug('Memberships fetched', { memberships })

			const debugHeaderValue = request.get(debugHeader).trim()
			const requestDebug = debugHeaderValue === '1' && fetchedMemberships.some(it => schema.acl.roles[it.role]?.debug)
			if (requestDebug) {
				koaContext.state.sendServerTimingHeader = true
			}

			const projectRoles = memberships.map(it => it.role)


			const [graphQlSchema, permissions] = await timer('GraphQLSchemaCreate', () => projectContainer.graphQlSchemaFactory.create(schema, {
				projectRoles: projectRoles,
			}))

			const handler = await (async () => {
				const existingHandler = handlerCache.get(graphQlSchema)
				if (existingHandler) {
					return existingHandler
				}
				const newHandler = await this.handlerFactory.create(graphQlSchema)
				handlerCache.set(graphQlSchema, newHandler)
				return newHandler
			})()

			await requestLogger.scope(async logger => {
				logger.debug('Content query processing started')

				await timer('GraphQL', () => handler({
					request,
					response,
					createContext: ({ operation }) => {
						const connection = operation === 'query' ? projectContainer.readConnection : projectContainer.connection
						const contentDatabase = connection.createClient(stage.schema, { module: 'content' })

						return this.contentGraphqlContextFactory.create({
							db: contentDatabase,
							authResult,
							memberships,
							permissions,
							schema,
							timer,
							koaContext,
							requestDebug,
						})
					},
				}))
				logger.debug('Content query finished')
			})


			notModifiedRes?.setResponseHeader(response)
		}
	}
}
