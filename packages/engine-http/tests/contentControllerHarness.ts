import { spyOn } from 'bun:test'
import { Client as PgClient } from 'pg'
import Koa from 'koa'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { GraphQLError, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { buildSchema, builtInScalars } from '@contember/graphql-json'
import { Connection, emptyDatabaseMetadata, EventManager, Pool } from '@contember/database'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { Context, ExecutionContainerFactory } from '@contember/engine-content-api'
import { emptySchema } from '@contember/schema-utils'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { noopTracer } from '@contember/telemetry'
import { createMock } from './utils.js'
import { ContentApiControllerFactory } from '../src/content/ContentApiControllerFactory.js'
import { ContentGraphQLEngine, ContentGraphQLSchema } from '../src/content/ContentGraphQLEngine.js'
import { ContentQueryHandlerFactory } from '../src/content/ContentQueryHandlerFactory.js'
import { ContentRequestLog } from '../src/content/ContentRequestLog.js'
import { ContentSchemaResolver } from '../src/content/ContentSchemaResolver.js'
import { GraphQlSchemaFactory } from '../src/content/GraphQlSchemaFactory.js'
import { NotModifiedChecker } from '../src/content/NotModifiedChecker.js'
import { ProjectMembershipResolver } from '../src/content/ProjectMembershipResolver.js'
import { ProjectContextResolver } from '../src/project-common/index.js'
import { ProjectContainer } from '../src/project/ProjectContainer.js'
import { ProjectDatabaseMetadataResolver } from '../src/project/ProjectDatabaseMetadataResolver.js'
import { ProjectConfig } from '../src/project/config.js'
import { ProjectGroupContainer } from '../src/projectGroup/ProjectGroupContainer.js'
import { TestTransactionService } from '../src/testing/index.js'
import { createProviders } from '../src/providers.js'

const unavailable = (): never => {
	throw new Error('Unused test dependency')
}
const stage = { id: 'a4c9b8f2-6a1e-4a3f-9a4b-1f2e3d4c5b6a', name: 'Live', slug: 'live', schema: 'stage_live' }

export interface ContentControllerHarnessOptions {
	forcePrimaryHeader?: boolean
	withReplica?: boolean
	/** Roles of the identity's project memberships. */
	roles?: string[]
	requestLog?: ContentRequestLog
}

/** The content API controller over mocked primary and replica connections; resolvers query `SELECT marker`. */
export const createContentControllerHarness = (
	engine: ContentGraphQLEngine,
	{ forcePrimaryHeader = true, withReplica = true, roles = [], requestLog }: ContentControllerHarnessOptions = {},
) => {
	const statements: { side: string; sql: string }[] = []
	const preparation: DatabaseContext[] = []
	let replicaAvailable = true
	const database = (side: 'primary' | 'replica') => {
		const client: ReturnType<ConstructorParameters<typeof Pool>[0]> = new PgClient()
		spyOn(client, 'connect').mockResolvedValue(undefined)
		spyOn(client, 'end').mockResolvedValue(undefined)
		const query = spyOn(client, 'query')
		const events = new EventManager(null)
		events.on(EventManager.Event.queryStart, ({ sql }) => {
			statements.push({ side, sql })
			if (side === 'replica' && !replicaAvailable) {
				query.mockRejectedValueOnce(new Error('Replica unavailable'))
				return
			}
			const rows = sql.includes('"stage_transaction"')
				? [{ transaction_id: side === 'primary' ? 'new-ref' : 'old-ref' }]
				: sql.includes('"stage"')
				? [stage]
				: [{ marker: side }]
			query.mockResolvedValueOnce({ rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] })
		})
		return new Connection(new Pool(() => client, { maxConnections: 1, logError: () => {} }), events)
	}
	const primary = database('primary')
	const replica = withReplica ? database('replica') : primary
	const providers = createProviders()
	const logger = createLogger(new TestLoggerHandler())
	const systemDatabaseContextFactory = new DatabaseContextFactory('system', providers)
	const project: ProjectConfig = {
		slug: 'test',
		name: 'Test',
		stages: [],
		db: { host: 'primary', port: 5432, user: 'test', password: 'test', database: 'test', read: { host: 'replica' } },
	}
	const projectContainer: ProjectContainer = {
		project,
		logger,
		connection: primary,
		readConnection: replica,
		systemDatabaseContextFactory,
		systemDatabaseContext: systemDatabaseContextFactory.create(primary),
		systemReadDatabaseContext: systemDatabaseContextFactory.create(replica),
		contentSchemaResolver: createMock<ContentSchemaResolver>({
			clearCache: () => {},
			getSchema: async ({ db }) => {
				preparation.push(db)
				return { schema: emptySchema, meta: {} }
			},
		}),
		projectDatabaseMetadataResolver: createMock<ProjectDatabaseMetadataResolver>({
			resolveDatabaseMetadata: async db => {
				preparation.push(db)
				return emptyDatabaseMetadata
			},
		}),
		get projectInitializer() {
			return unavailable()
		},
	}
	// no info parameter, so one function serves as a resolver on both engines
	const marker = async (_source: unknown, _args: unknown, context: Context) => {
		const result = await context.db.query<{ marker: string }>('SELECT marker')
		return result.rows[0].marker
	}
	const fail = () => {
		throw new GraphQLError('Mutation failed')
	}
	const schema: ContentGraphQLSchema = engine === 'graphql-json'
		? {
			engine,
			schema: {
				schema: buildSchema('type Query { marker: String } type Mutation { marker: String fail: String }'),
				resolvers: [{ Query: { marker }, Mutation: { marker, fail } }],
				scalars: builtInScalars,
			},
		}
		: {
			engine,
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<unknown, Context>({ name: 'Query', fields: { marker: { type: GraphQLString, resolve: marker } } }),
				mutation: new GraphQLObjectType<unknown, Context>({
					name: 'Mutation',
					fields: { marker: { type: GraphQLString, resolve: marker }, fail: { type: GraphQLString, resolve: fail } },
				}),
			}),
		}
	const controller = new ContentApiControllerFactory(
		new NotModifiedChecker(),
		new ExecutionContainerFactory(providers),
		new ContentQueryHandlerFactory(false),
		createMock<ProjectContextResolver>({ resolve: async () => ({ projectContainer, project }) }),
		createMock<GraphQlSchemaFactory>({ create: async () => ({ schema, permissions: {}, allPermissions: {} }) }),
		new TestTransactionService(false),
		forcePrimaryHeader,
		undefined,
		requestLog,
	).create()
	const projectGroup: ProjectGroupContainer = {
		slug: undefined,
		logger,
		projectMembershipResolver: createMock<ProjectMembershipResolver>({
			resolveMemberships: async () => {
				const memberships = roles.map(role => ({ role, variables: [] }))
				return { effective: memberships, fetched: memberships }
			},
		}),
		get authenticator() {
			return unavailable()
		},
		get projectContainerResolver() {
			return unavailable()
		},
		get projectSchemaResolver() {
			return unavailable()
		},
		get projectInitializer() {
			return unavailable()
		},
		get tenantContainer() {
			return unavailable()
		},
		get tenantGraphQLHandler() {
			return unavailable()
		},
		get systemContainer() {
			return unavailable()
		},
		get systemGraphQLHandler() {
			return unavailable()
		},
	}
	return {
		statements,
		preparation,
		primarySystem: projectContainer.systemDatabaseContext,
		replicaSystem: projectContainer.systemReadDatabaseContext,
		setReplicaUnavailable: () => {
			replicaAvailable = false
		},
		close: async () => {
			await primary.end()
			if (replica !== primary) {
				await replica.end()
			}
		},
		request: async (query: string, headers: Record<string, string> = {}, variables?: Record<string, unknown>) => {
			const message = new IncomingMessage(new Socket())
			message.method = 'POST'
			message.url = '/content/test/live'
			message.headers = headers
			const response = new ServerResponse(message)
			const koa = new Koa().createContext(message, response)
			const body = { query, variables }
			Object.assign(koa.request, { body })
			const result = await controller({
				koa,
				body,
				request: message,
				response,
				projectGroup,
				logger,
				url: new URL('http://localhost/content/test/live'),
				clientIp: '127.0.0.1',
				timer: (_event, callback) => callback(),
				tracer: noopTracer,
				requestDebugMode: false,
				authResult: { valid: true, identityId: 'identity', apiKeyId: 'key', roles: [], personId: null, trustForwardedInfo: false },
				params: { projectSlug: 'test', stageSlug: 'live' },
			})
			return { koa, result }
		},
	}
}
