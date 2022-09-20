import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectGroupResolver, ProjectInfoMiddlewareState } from '../project-common'
import { AuthResult, HttpError, TimerMiddlewareState } from '../common'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { NotModifiedChecker } from './NotModifiedChecker'
import { ContentGraphQLContextFactory } from './ContentGraphQLContextFactory'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory'
import { GraphQLSchema } from 'graphql'
import { GraphQLKoaState } from '../graphql'
import { Logger } from '@contember/engine-common'

type ContentApiMiddlewareKoaState =
	& TimerMiddlewareState
	& KoaRequestState
	& GraphQLKoaState
	& ProjectInfoMiddlewareState
	& { authResult: AuthResult }


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
			koaContext.state.authResult = authResult

			// eslint-disable-next-line no-console
			const logger = new Logger(console.log)
			logger.group(`Initializing ${groupContainer.slug}/${params.projectSlug}`)

			const projectContainer = await groupContainer.projectContainerResolver.getProjectContainer(params.projectSlug, {
				alias: true,
				logger,
			})
			logger.groupEnd()
			if (projectContainer === undefined) {
				throw new HttpError(`Project ${params.projectSlug} NOT found`, 404)
			}
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
				stageSlug: stage.slug,
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

			const debugHeaderValue = request.get(debugHeader).trim()
			const requestDebug = debugHeaderValue === '1' && fetchedMemberships.some(it => schema.acl.roles[it.role]?.debug)
			if (requestDebug) {
				koaContext.state.sendServerTimingHeader = true
			}

			const projectRoles = memberships.map(it => it.role)

			const contentDatabase = projectContainer.connection.createClient(stage.schema, { module: 'content' })

			const [graphQlSchema, permissions] = await timer('GraphQLSchemaCreate', () => projectContainer.graphQlSchemaFactory.create(schema, {
				projectRoles: projectRoles,
			}))

			const handler = await (async () => {
				const existingHandler = handlerCache.get(graphQlSchema)
				if (existingHandler) {
					return existingHandler
				}
				const newHandler = await this.handlerFactory.create(graphQlSchema, project.slug)
				handlerCache.set(graphQlSchema, newHandler)
				return newHandler
			})()


			const graphqlContext = this.contentGraphqlContextFactory.create({
				db: contentDatabase,
				authResult,
				memberships,
				permissions,
				schema,
				timer,
				koaContext,
				requestDebug,
			})

			await timer('GraphQL', () => handler({
				request,
				response,
				context: graphqlContext,
			}))


			notModifiedRes?.setResponseHeader(response)
		}
	}
}
