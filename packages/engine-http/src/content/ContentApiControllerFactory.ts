import { createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { GraphQLSchema } from 'graphql'
import { HttpController } from '../application'
import { HttpErrorResponse, HttpResponse } from '../common'
import { GraphQLKoaState } from '../graphql'
import { ProjectContextResolver } from '../project-common'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { NotModifiedChecker } from './NotModifiedChecker'

const debugHeader = 'x-contember-debug'

export class ContentApiControllerFactory {
	constructor(
		private readonly notModifiedChecker: NotModifiedChecker,
		private readonly executionContainerFactory: ExecutionContainerFactory,
		private readonly handlerFactory: ContentQueryHandlerFactory,
		private readonly projectContextResolver: ProjectContextResolver,
		private readonly graphQlSchemaFactory: GraphQlSchemaFactory,
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

			const schemaWithMeta = await projectContainer.contentSchemaResolver.getSchema({ db: systemDatabase, stage: stage.slug, normalize: true })
			const schema = schemaWithMeta.schema
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
				() => this.graphQlSchemaFactory.create(schema, {
					projectRoles: projectRoles,
				}, project),
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
						(koa.state as GraphQLKoaState).graphql = {
							operationName: operation,
						}

						const connection = operation === 'query' ? projectContainer.readConnection : projectContainer.connection
						const contentDatabase = connection.createClient(stage.schema, { module: 'content' })


						const identityVariables = createAclVariables(schema.acl, memberships)
						let identityId = authResult.identityId
						if (
							authResult.assumedIdentityId &&
							memberships.some(it => schema.acl.roles[it.role].system?.assumeIdentity)
						) {
							identityId = authResult.assumedIdentityId
						}

						const executionContainer = this.executionContainerFactory.create({
							db: contentDatabase,
							identityVariables,
							identityId,
							schema,
							schemaMeta: { id: schemaWithMeta.meta.id },
							schemaDatabaseMetadata,
							permissions,
							systemSchema: projectContainer.systemDatabaseContextFactory.schemaName,
							stage,
							project,
						})

						return {
							db: contentDatabase,
							identityVariables,
							identityId,
							executionContainer,
							timer,
							requestDebug,
							project,
						}
					},
				}))
				logger.debug('Content query finished')
			})


			notModifiedRes?.setResponseHeader(context.response)
		}
	}
}
