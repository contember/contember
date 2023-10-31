import { HttpController } from '../application'
import { ProjectContextResolver } from '../project-common'
import { HttpErrorResponse, HttpResponse } from '../common'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { NotModifiedChecker } from './NotModifiedChecker'
import { ContentGraphQLContextFactory } from './ContentGraphQLContextFactory'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory'
import { GraphQLSchema } from 'graphql'

const debugHeader = 'x-contember-debug'

export class ContentApiControllerFactory {
	constructor(
		private readonly notModifiedChecker: NotModifiedChecker,
		private readonly contentGraphqlContextFactory: ContentGraphQLContextFactory,
		private readonly handlerFactory: ContentQueryHandlerFactory,
		private readonly projectContextResolver: ProjectContextResolver,
	) {
	}

	create(): HttpController {
		const handlerCache = new WeakMap<GraphQLSchema, ContentQueryHandler>()
		return async context => {
			const { params, timer, projectGroup, authResult, request, koa } = context
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			const { projectContainer, project } = await this.projectContextResolver.resolve(context)

			const logger = context.logger.child({
				project: project.slug,
			})

			const systemDatabase = projectContainer.systemReadDatabaseContext
			const stage = await systemDatabase.queryHandler.fetch(new StageBySlugQuery(params.stageSlug))
			if (!stage) {
				return new HttpErrorResponse(404, `Stage ${params.stageSlug} NOT found`)
			}
			const notModifiedRes = await this.notModifiedChecker.checkNotModified({
				request: context.request,
				body: context.body,
				timer: context.timer,
				systemDatabase,
				stageId: stage.id,
			})
			if (notModifiedRes?.isModified === false) {
				return new HttpResponse(304)
			}

			const schema = await projectContainer.contentSchemaResolver.getSchema(systemDatabase, stage.slug)

			const { effective: memberships, fetched: fetchedMemberships } = await timer(
				'MembershipFetch',
				() => projectGroup.projectMembershipResolver.resolveMemberships({
					request: koa,
					acl: schema.acl,
					projectSlug: project.slug,
					identity: {
						identityId: authResult.identityId,
						personId: authResult.personId ?? undefined,
						roles: authResult.roles,
					},
				}),
			)

			logger.debug('Memberships fetched', { memberships })

			const debugHeaderValue = request.headers[debugHeader]
			if (Array.isArray(debugHeaderValue)) {
				return new HttpErrorResponse(400, `Invalid format of ${debugHeader}`)
			}
			const requestDebug = debugHeaderValue === '1' && fetchedMemberships.some(it => schema.acl.roles[it.role]?.debug)
			if (requestDebug) {
				context.requestDebugMode = true
			}

			const projectRoles = memberships.map(it => it.role)

			const { schema: graphQlSchema, permissions } = await timer(
				'GraphQLSchemaCreate',
				() => projectContainer.graphQlSchemaFactory.create(schema, {
					projectRoles: projectRoles,
				}),
			)


			const schemaDatabaseMetadata = await projectContainer.projectDatabaseMetadataResolver.resolveDatabaseMetadata(systemDatabase, schema, stage.schema)

			const handler = await (async () => {
				const existingHandler = handlerCache.get(graphQlSchema)
				if (existingHandler) {
					return existingHandler
				}
				const newHandler = await this.handlerFactory.create(graphQlSchema)
				handlerCache.set(graphQlSchema, newHandler)
				return newHandler
			})()

			await logger.scope(async logger => {
				logger.debug('Content query processing started')

				await timer('GraphQL', () => handler({
					request: koa.request,
					response: koa.response,
					createContext: ({ operation }) => {
						const connection = operation === 'query' ? projectContainer.readConnection : projectContainer.connection
						const contentDatabase = connection.createClient(stage.schema, { module: 'content' })

						return this.contentGraphqlContextFactory.create({
							db: contentDatabase,
							authResult,
							memberships,
							permissions,
							schemaDatabaseMetadata,
							schema,
							timer,
							koaContext: koa,
							requestDebug,
							systemSchema: projectContainer.systemDatabaseContextFactory.schemaName,
							stage,
							project,
						})
					},
				}))
				logger.debug('Content query finished')
			})


			notModifiedRes?.setResponseHeader(context.response)
		}
	}
}
