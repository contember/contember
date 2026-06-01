import { createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { StageBySlugQuery } from '@contember/engine-system-api'
import { Client } from '@contember/database'
import { GraphQLSchema } from 'graphql'
import { HttpController } from '../application/index.js'
import { HttpErrorResponse, HttpResponse } from '../common/index.js'
import { GraphQLKoaState } from '../graphql/index.js'
import { ProjectContextResolver } from '../project-common/index.js'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory.js'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory.js'
import { NotModifiedChecker } from './NotModifiedChecker.js'
import { TestTransactionService } from '../testing/index.js'

const debugHeader = 'x-contember-debug'
const testSessionHeader = 'x-contember-test-session'

export class ContentApiControllerFactory {
	constructor(
		private readonly notModifiedChecker: NotModifiedChecker,
		private readonly executionContainerFactory: ExecutionContainerFactory,
		private readonly handlerFactory: ContentQueryHandlerFactory,
		private readonly projectContextResolver: ProjectContextResolver,
		private readonly graphQlSchemaFactory: GraphQlSchemaFactory,
		private readonly testTransactionService: TestTransactionService,
	) {
	}

	create(): HttpController {
		const handlerCache = new WeakMap<GraphQLSchema, ContentQueryHandler>()
		return async context => {
			const { params, timer, projectGroup, authResult, request, koa, clientIp } = context
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
				() =>
					projectGroup.projectMembershipResolver.resolveMemberships({
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

			const { schema: graphQlSchema, permissions, allPermissions } = await timer(
				'GraphQLSchemaCreate',
				() =>
					this.graphQlSchemaFactory.create(schema, {
						projectRoles: projectRoles,
					}, project),
			)

			const schemaDatabaseMetadata = await projectContainer.projectDatabaseMetadataResolver.resolveDatabaseMetadata(systemDatabase, schema, stage.schema)

			// Test-transaction mode: if the request carries a session header, bind its content DB
			// client to the session's pinned (rolled-back-later) transaction. Decided here, from the
			// request itself — no async-context routing.
			let testContentDatabase: Client | undefined
			if (this.testTransactionService.isEnabled()) {
				const headerValue = request.headers[testSessionHeader]
				if (headerValue !== undefined) {
					const token = Array.isArray(headerValue) ? headerValue[0] : headerValue
					testContentDatabase = await this.testTransactionService.resolveContentClient(
						token,
						project.slug,
						projectContainer.connection,
						stage.schema,
						{ module: 'content' },
					)
					if (!testContentDatabase) {
						return new HttpErrorResponse(400, 'Unknown or expired test transaction session')
					}
				}
			}

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

				await timer('GraphQL', () =>
					handler({
						request: koa.request,
						response: koa.response,
						createContext: ({ operation }) => {
							;(koa.state as GraphQLKoaState).graphql = {
								operationName: operation,
							}

							const baseConnection = operation === 'query' ? projectContainer.readConnection : projectContainer.connection
							const maxConnectionsPerRequest = 'maxConnectionsPerRequest' in project.db
								? project.db.maxConnectionsPerRequest
								: undefined
							// Optionally cap how many pool connections this single request may hold concurrently,
							// so one request cannot starve the shared pool under high concurrency. Defaults to unlimited.
							const connection = maxConnectionsPerRequest !== undefined
								? baseConnection.withMaxConnections(maxConnectionsPerRequest)
								: baseConnection
							const contentDatabase = testContentDatabase ?? connection.createClient(stage.schema, { module: 'content' })

							const identityVariables = createAclVariables(schema.acl, memberships)
							let identityId = authResult.identityId
							if (
								authResult.assumedIdentityId
								&& memberships.some(it => schema.acl.roles[it.role].system?.assumeIdentity)
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
								allPermissions,
								systemSchema: projectContainer.systemDatabaseContextFactory.schemaName,
								stage,
								project,
								userInfo: {
									ipAddress: clientIp,
									userAgent: authResult.clientUserAgent ?? null,
								},
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
