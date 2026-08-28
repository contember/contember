import { createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { DatabaseContext, StageBySlugQuery } from '@contember/engine-system-api'
import { Client, Connection, DatabaseError, PinnedConnection } from '@contember/database'
import { GraphQLSchema, OperationTypeNode } from 'graphql'
import { HttpController } from '../application/index.js'
import { HttpErrorResponse, HttpResponse } from '../common/index.js'
import { GraphQLKoaState } from '../graphql/index.js'
import { ProjectContextResolver } from '../project-common/index.js'
import { ContentQueryHandler, ContentQueryHandlerFactory } from './ContentQueryHandlerFactory.js'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory.js'
import { NotModifiedChecker } from './NotModifiedChecker.js'
import { TestTransactionService } from '../testing/index.js'
import {
	databaseErrorAttributes,
	formatWriteRef,
	isVisibleOnReplica,
	parseReadAfterHeader,
	readAfterHeaderName,
	readAfterVisibleHeaderName,
	SimpleWriteRefSink,
	writeRefHeaderName,
} from './readAfterWrite/index.js'

const debugHeader = 'x-contember-debug'
const testSessionHeader = 'x-contember-test-session'

/** Result of the attempt to serve a request from a pinned replica connection. */
type PinnedOutcome =
	| { kind: 'done'; response: HttpResponse | undefined }
	| { kind: 'miss' }
	| { kind: 'error'; error: unknown }

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

			// Parse the operation up front: the not-modified check and the connection choice both need
			// the operation type. Cost: a 304 now also pays membership resolution, schema and database
			// metadata resolution and the parse/validate pass, all of which are cached.
			const prepareResult = handler.prepare(koa.request)
			if (!prepareResult.ok) {
				return prepareResult.respond(koa.response)
			}
			const prepared = prepareResult.prepared

			// Read-after-write: a query carrying write refs may only be served from a replica that has
			// already applied them. The whole request - the not-modified check included - then runs on
			// that one pinned replica connection, otherwise a lagging replica could answer 304 wrongly.
			const readAfterWriteState = await projectContainer.readAfterWrite.resolve()
			const writeRefSink = readAfterWriteState.enabled ? new SimpleWriteRefSink() : undefined
			const readAfter = readAfterWriteState.enabled && prepared.operation === OperationTypeNode.QUERY && !testContentDatabase
				? parseReadAfterHeader(koa.request.get(readAfterHeaderName) || undefined, readAfterWriteState.clusterId)
				: null

			const maxConnectionsPerRequest = 'maxConnectionsPerRequest' in project.db
				? project.db.maxConnectionsPerRequest
				: undefined
			// Optionally cap how many pool connections this single request may hold concurrently,
			// so one request cannot starve the shared pool under high concurrency. Defaults to unlimited.
			const capConnections = (connection: Connection): Connection.ConnectionType =>
				maxConnectionsPerRequest !== undefined ? connection.withMaxConnections(maxConnectionsPerRequest) : connection

			const runRequest = async ({ connection, routedSystemDatabase, ack }: {
				connection: Connection.ConnectionType
				routedSystemDatabase: DatabaseContext
				ack: string[] | null
			}): Promise<HttpResponse | undefined> => {
				const setAckHeader = () => {
					if (ack !== null) {
						koa.response.set(readAfterVisibleHeaderName, ack.join(','))
					}
				}
				const notModifiedRes = await this.notModifiedChecker.checkNotModified({
					request: context.request,
					operation: prepared.operation,
					timer: context.timer,
					systemDatabase: routedSystemDatabase,
					stageId: stage.id,
				})
				if (notModifiedRes?.isModified === false) {
					// the probe already proved these refs are visible here, so the client may retire them
					setAckHeader()
					return new HttpResponse(304)
				}

				await logger.scope(async logger => {
					logger.debug('Content query processing started')

					await timer('GraphQL', () =>
						handler.execute({
							prepared,
							request: koa.request,
							response: koa.response,
							createContext: ({ operation }) => {
								;(koa.state as GraphQLKoaState).graphql = {
									operationName: operation,
								}

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
									writeRefSink,
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

				setAckHeader()
				if (readAfterWriteState.enabled && writeRefSink?.xid !== undefined) {
					koa.response.set(writeRefHeaderName, formatWriteRef(readAfterWriteState.clusterId, writeRefSink.xid))
				}

				notModifiedRes?.setResponseHeader(context.response)
				return undefined
			}

			// never log the token values themselves - only how many there were
			const logDecision = (route: 'replica' | 'primary' | 'off', reason?: string) =>
				logger.debug(`readAfterWrite: ${route}`, { tokenCount: readAfter?.tokens.length ?? 0, reason })

			if (readAfter === null) {
				logDecision('off')
				const baseConnection = prepared.operation === OperationTypeNode.QUERY
					? projectContainer.readConnection
					: projectContainer.connection
				return await runRequest({
					connection: capConnections(baseConnection),
					routedSystemDatabase: prepared.operation === OperationTypeNode.QUERY
						? projectContainer.systemReadDatabaseContext
						: projectContainer.systemDatabaseContext,
					ack: null,
				})
			}

			const runOnPrimary = async (reason: string) => {
				logDecision('primary', reason)
				return await runRequest({
					connection: capConnections(projectContainer.connection),
					routedSystemDatabase: projectContainer.systemDatabaseContext,
					ack: null,
				})
			}

			if (!readAfter.valid) {
				// a client or a proxy mangling the header turns the feature off for it, silently and indefinitely
				logger.warn('Read-after-write: the request carried unusable write refs, serving from the primary', {
					tokenCount: readAfter.tokens.length,
				})
				return await runOnPrimary('unusable tokens')
			}

			const tokens = readAfter.tokens
			let replicaAcquired = false
			let outcome: PinnedOutcome
			try {
				outcome = await projectContainer.readConnection.scope(async (acquired): Promise<PinnedOutcome> => {
					replicaAcquired = true
					if (!await timer('ReadAfterWriteProbe', () => isVisibleOnReplica(acquired, readAfter.xids, logger))) {
						return { kind: 'miss' }
					}
					logDecision('replica')
					const pinned = new PinnedConnection(acquired, projectContainer.readConnection)
					try {
						const response = await runRequest({
							connection: pinned,
							routedSystemDatabase: projectContainer.systemDatabaseContextFactory.create(pinned),
							ack: tokens,
						})
						return { kind: 'done', response }
					} catch (e) {
						if (e instanceof DatabaseError) {
							// the connection may be left mid-transaction (a timed-out ROLLBACK, a broken socket);
							// throwing lets the pool dispose it instead of running the next probe in a leaked snapshot
							throw e
						}
						// an application error says nothing about the connection - do not dispose a healthy one
						return { kind: 'error', error: e }
					}
				})
			} catch (e) {
				// only a failure to acquire the replica connection may fall back; whatever the request
				// itself threw was re-thrown above and must reach the client
				if (replicaAcquired) {
					throw e
				}
				logger.warn('Read-after-write: could not acquire a replica connection, serving from the primary', databaseErrorAttributes(e))
				return await runOnPrimary('replica unavailable')
			}
			if (outcome.kind === 'error') {
				throw outcome.error
			}
			if (outcome.kind === 'done') {
				return outcome.response
			}
			return await runOnPrimary('replica behind')
		}
	}
}
