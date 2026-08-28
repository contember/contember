import { describe, expect, test } from 'bun:test'
import Koa from 'koa'
import EventEmitter from 'node:events'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { URL } from 'node:url'
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { Connection, emptyDatabaseMetadata, EventManager, Pool } from '@contember/database'
import { DatabaseContextFactory } from '@contember/engine-system-api'
import { ExecutionContainerFactory } from '@contember/engine-content-api'
import { emptySchema } from '@contember/schema-utils'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { createMock } from '../../utils.js'
import { Timer } from '../../../src/application/index.js'
import { AuthResult, HttpResponse } from '../../../src/common/index.js'
import { ContentApiControllerFactory } from '../../../src/content/ContentApiControllerFactory.js'
import { ContentGraphqlContext } from '../../../src/content/ContentGraphqlContext.js'
import { ContentQueryHandlerFactory } from '../../../src/content/ContentQueryHandlerFactory.js'
import { ContentSchemaResolver } from '../../../src/content/ContentSchemaResolver.js'
import { GraphQlSchemaFactory } from '../../../src/content/GraphQlSchemaFactory.js'
import { NotModifiedChecker } from '../../../src/content/NotModifiedChecker.js'
import { ProjectMembershipResolver } from '../../../src/content/ProjectMembershipResolver.js'
import { ProjectContextResolver } from '../../../src/project-common/index.js'
import { ProjectContainer } from '../../../src/project/ProjectContainer.js'
import { ProjectDatabaseMetadataResolver } from '../../../src/project/ProjectDatabaseMetadataResolver.js'
import { ProjectConfig } from '../../../src/project/config.js'
import { ProjectGroupContainer } from '../../../src/projectGroup/ProjectGroupContainer.js'
import { ReadAfterWriteResolver } from '../../../src/content/readAfterWrite/index.js'
import { TestTransactionService } from '../../../src/testing/index.js'
import { createProviders } from '../../../src/providers.js'

const clusterId = '7412094958558216905'
const stageId = 'a4c9b8f2-6a1e-4a3f-9a4b-1f2e3d4c5b6a'
const stage = { id: stageId, name: 'Live', slug: 'live', schema: 'stage_live' }
const contentMarker = 'SELECT marker'
const token = `${clusterId}:1054`

const timeout = async (ms = 5) => await new Promise<void>(resolve => setTimeout(resolve, ms))

const unavailable = (name: string): never => {
	throw new Error(`${name} is not available in this test double`)
}

/** A connection whose scope can be made to fail, standing in for an exhausted pool or a dead replica. */
class TestConnection extends Connection {
	public failScopeWith: Error | undefined

	override async scope<Result>(
		callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		if (this.failScopeWith !== undefined) {
			throw this.failScopeWith
		}
		return await super.scope(callback, options)
	}
}

type DatabaseOptions = {
	visible: () => boolean
	latestTransactionId?: string | null
	failQuery?: (sql: string) => Error | undefined
}

/** A database double: a real pool over a fake pg client that answers by statement and records them. */
const createDatabase = ({ visible, latestTransactionId = null, failQuery }: DatabaseOptions) => {
	const queries: string[] = []
	let created = 0
	const respond = (sql: string): readonly Record<string, unknown>[] => {
		if (sql.includes('pg_control_system')) {
			return [{ version: 160000, cluster_id: clusterId }]
		}
		if (sql.includes('pg_xact_status')) {
			return [{ visible: visible() }]
		}
		if (sql.includes('"stage_transaction"')) {
			return latestTransactionId === null ? [] : [{ transaction_id: latestTransactionId }]
		}
		if (sql.includes('"stage"')) {
			return [stage]
		}
		return []
	}
	class FakePgClient extends EventEmitter {
		async connect() {}

		async end() {}

		async query(sql: string) {
			queries.push(sql)
			const failure = failQuery?.(sql)
			if (failure !== undefined) {
				throw failure
			}
			const rows = JSON.parse(JSON.stringify(respond(sql)))
			return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] }
		}
	}
	// one connection only: a request that failed to stay on the pinned connection would block here
	const pool = new Pool(() => {
		created++
		return new FakePgClient()
	}, { maxConnections: 1, logError: () => null })
	const connection = new TestConnection(pool)
	return {
		connection,
		queries,
		clientsCreated: () => created,
		clientsDisposed: () => connection.getPoolStatus().stats.connection_disposed_manual_count,
	}
}

const project: ProjectConfig = {
	slug: 'test',
	name: 'Test',
	stages: [{ slug: 'live', name: 'Live' }],
	db: {
		host: 'primary.example.com',
		port: 5432,
		user: 'contember',
		password: 'contember',
		database: 'contember',
		read: { host: 'replica.example.com' },
	},
}

/** Every operation runs one marker statement, so the test can tell which database served it. */
const graphQlSchema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			marker: {
				type: GraphQLString,
				resolve: async (_source, _args, context: ContentGraphqlContext) => {
					await context.db.query(contentMarker)
					return 'ok'
				},
			},
		},
	}),
	mutation: new GraphQLObjectType({
		name: 'Mutation',
		fields: {
			touch: {
				type: GraphQLString,
				resolve: async (_source, _args, context: ContentGraphqlContext) => {
					await context.db.query(contentMarker)
					return 'ok'
				},
			},
		},
	}),
})

type HarnessOptions = {
	notModifiedChecker?: NotModifiedChecker
	latestTransactionId?: string | null
	replicaFailQuery?: (sql: string) => Error | undefined
}

const createHarness = ({ notModifiedChecker, latestTransactionId = null, replicaFailQuery }: HarnessOptions = {}) => {
	const providers = createProviders()
	const logHandler = new TestLoggerHandler()
	const logger = createLogger(logHandler)
	let probeVisible = true
	let committedXid: string | undefined
	let beforeRouting: (() => void) | undefined

	const primary = createDatabase({ visible: () => probeVisible })
	const replica = createDatabase({ visible: () => probeVisible, latestTransactionId, failQuery: replicaFailQuery })

	const systemDatabaseContextFactory = new DatabaseContextFactory('system', providers)
	const projectContainer: ProjectContainer = {
		project,
		logger,
		connection: primary.connection,
		readConnection: replica.connection,
		systemDatabaseContextFactory,
		systemDatabaseContext: systemDatabaseContextFactory.create(primary.connection),
		systemReadDatabaseContext: systemDatabaseContextFactory.create(replica.connection),
		contentSchemaResolver: createMock<ContentSchemaResolver>({
			clearCache: () => {},
			getSchema: async () => {
				// hook: the stage is resolved, the routing decision has not been taken yet
				beforeRouting?.()
				return { schema: emptySchema, meta: {} }
			},
		}),
		readAfterWrite: new ReadAfterWriteResolver(project, primary.connection, replica.connection, logger),
		projectDatabaseMetadataResolver: createMock<ProjectDatabaseMetadataResolver>({
			resolveDatabaseMetadata: async () => emptyDatabaseMetadata,
		}),
		get projectInitializer() {
			return unavailable('projectInitializer')
		},
	}

	const realExecutionContainerFactory = new ExecutionContainerFactory(providers)
	const executionContainerFactory = createMock<ExecutionContainerFactory>({
		hooks: realExecutionContainerFactory.hooks,
		create: args => {
			// stands in for a mutation that committed: the resolver records the id into the sink
			if (committedXid !== undefined) {
				args.writeRefSink?.record(committedXid)
			}
			return realExecutionContainerFactory.create(args)
		},
		createBuilder: args => realExecutionContainerFactory.createBuilder(args),
		createBuilderInternal: args => realExecutionContainerFactory.createBuilderInternal(args),
	})

	const controller = new ContentApiControllerFactory(
		notModifiedChecker ?? new NotModifiedChecker(),
		executionContainerFactory,
		new ContentQueryHandlerFactory(false),
		createMock<ProjectContextResolver>({
			resolve: async () => ({ projectContainer, project }),
		}),
		createMock<GraphQlSchemaFactory>({
			create: () => ({ schema: graphQlSchema, permissions: {} }),
		}),
		new TestTransactionService(false),
	).create()

	const projectGroup: ProjectGroupContainer = {
		slug: undefined,
		logger,
		projectMembershipResolver: createMock<ProjectMembershipResolver>({
			resolveMemberships: async () => ({ effective: [], fetched: [] }),
		}),
		get authenticator() {
			return unavailable('authenticator')
		},
		get projectContainerResolver() {
			return unavailable('projectContainerResolver')
		},
		get projectSchemaResolver() {
			return unavailable('projectSchemaResolver')
		},
		get projectInitializer() {
			return unavailable('projectInitializer')
		},
		get tenantContainer() {
			return unavailable('tenantContainer')
		},
		get tenantGraphQLHandler() {
			return unavailable('tenantGraphQLHandler')
		},
		get systemContainer() {
			return unavailable('systemContainer')
		},
		get systemGraphQLHandler() {
			return unavailable('systemGraphQLHandler')
		},
	}

	const authResult: AuthResult = {
		valid: true,
		identityId: '6f2d4d9a-3b73-4f9c-9d0a-2b3c4d5e6f70',
		apiKeyId: '0c1f2e3d-4b5a-6978-8a9b-0c1d2e3f4a5b',
		roles: [],
		personId: null,
		trustForwardedInfo: false,
	}
	const timer: Timer = (event, cb) => cb()

	const request = async (
		{ query, headers = {}, onBeforeRouting }: { query: string; headers?: Record<string, string>; onBeforeRouting?: () => void },
	) => {
		beforeRouting = onBeforeRouting
		const message = new IncomingMessage(new Socket())
		message.method = 'POST'
		message.url = '/content/test/live'
		message.headers = { ...message.headers, ...headers }
		const response = new ServerResponse(message)
		const koa = new Koa().createContext(message, response)
		const body = { query }
		Object.assign(koa.request, { body })

		const result = await controller({
			koa,
			body,
			url: new URL('http://localhost/content/test/live'),
			clientIp: '127.0.0.1',
			logger,
			timer,
			request: message,
			response,
			requestDebugMode: false,
			authResult,
			params: { projectSlug: 'test', stageSlug: 'live' },
			projectGroup,
		})
		return { result, koa }
	}

	return {
		request,
		primary,
		replica,
		logs: logHandler.messages,
		setProbeVisible: (value: boolean) => {
			probeVisible = value
		},
		setCommittedXid: (value: string | undefined) => {
			committedXid = value
		},
		close: async () => {
			await primary.connection.end()
			await replica.connection.end()
		},
	}
}

const contentQueriesOf = (database: { queries: string[] }) => database.queries.filter(it => it === contentMarker)
const probeQueriesOf = (database: { queries: string[] }) => database.queries.filter(it => it.includes('pg_xact_status'))
const notModifiedQueriesOf = (database: { queries: string[] }) => database.queries.filter(it => it.includes('"stage_transaction"'))
const statusOf = (result: unknown) => result instanceof HttpResponse ? result.code : undefined
const warnings = (logs: { level: { name: string }; message: string }[]) => logs.filter(it => it.level.name === 'warn')

describe('content api read-after-write routing', () => {
	test('a mutation runs on the primary and reports the committed write ref', async () => {
		const harness = createHarness()
		harness.setCommittedXid('1054')

		const { koa } = await harness.request({ query: 'mutation { touch }' })

		expect(koa.response.get('X-Contember-Write-Ref')).toBe(`${clusterId}:1054`)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		await harness.close()
	})

	test('a mutation that wrote nothing reports no write ref', async () => {
		const harness = createHarness()

		const { koa } = await harness.request({ query: 'mutation { touch }' })

		expect(koa.response.get('X-Contember-Write-Ref')).toBe('')
		await harness.close()
	})

	test('a mutation carrying tokens runs on the primary, unprobed and unacknowledged', async () => {
		const harness = createHarness()

		// the client-wide tracker sends the header on every request, mutations included - only the
		// operation type keeps them off a read-only standby
		const { koa } = await harness.request({
			query: 'mutation { touch }',
			headers: { 'x-contember-read-after': token },
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		await harness.close()
	})

	test('a query without tokens goes to the replica without probing', async () => {
		const harness = createHarness()

		const { koa } = await harness.request({ query: '{ marker }' })

		expect(contentQueriesOf(harness.replica)).toHaveLength(1)
		expect(contentQueriesOf(harness.primary)).toHaveLength(0)
		expect(probeQueriesOf(harness.replica)).toHaveLength(0)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		await harness.close()
	})

	test('a query whose tokens the replica has applied is served from it and acknowledged', async () => {
		const harness = createHarness()
		harness.setProbeVisible(true)

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': `${token},${clusterId}:1055` },
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(1)
		expect(contentQueriesOf(harness.replica)).toHaveLength(1)
		expect(contentQueriesOf(harness.primary)).toHaveLength(0)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe(`${token},${clusterId}:1055`)
		await harness.close()
	})

	test('a query whose tokens the replica lags behind falls back to the primary without acknowledging', async () => {
		const harness = createHarness()
		harness.setProbeVisible(false)

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(1)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		await harness.close()
	})

	test('a failing probe falls back to the primary and keeps the connection', async () => {
		const harness = createHarness({
			replicaFailQuery: sql => sql.includes('pg_xact_status') ? new Error('probe exploded') : undefined,
		})

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
		})

		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		expect(warnings(harness.logs)).toHaveLength(1)
		// a probe that failed says nothing about the connection itself
		expect(harness.replica.clientsDisposed()).toBe(0)
		await harness.close()
	})

	test('an unavailable replica falls back to the primary without acknowledging', async () => {
		const harness = createHarness()
		// warm up so that the cluster check is cached and only the probe still needs the replica
		await harness.request({ query: '{ marker }' })
		harness.replica.queries.length = 0
		harness.primary.queries.length = 0

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
			onBeforeRouting: () => {
				harness.replica.connection.failScopeWith = new Error('pool exhausted')
			},
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		expect(warnings(harness.logs)).toHaveLength(1)
		harness.replica.connection.failScopeWith = undefined
		await harness.close()
	})

	test('a token of another cluster goes to the primary without probing', async () => {
		const harness = createHarness()

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': '12345:1054' },
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		await harness.close()
	})

	test('a malformed header goes to the primary without probing', async () => {
		const harness = createHarness()

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': 'not-a-token' },
		})

		expect(probeQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		expect(contentQueriesOf(harness.primary)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe('')
		await harness.close()
	})
})

describe('content api not-modified check on the pinned replica', () => {
	test('answers 304 from the pinned connection and still acknowledges the tokens', async () => {
		const harness = createHarness({ latestTransactionId: 'tx-42' })

		const { result, koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token, 'x-contember-ref': 'tx-42' },
		})

		expect(statusOf(result)).toBe(304)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe(token)
		// the check ran on the replica, and on the very connection the probe had pinned
		expect(notModifiedQueriesOf(harness.replica)).toHaveLength(1)
		expect(notModifiedQueriesOf(harness.primary)).toHaveLength(0)
		expect(harness.replica.clientsCreated()).toBe(1)
		expect(contentQueriesOf(harness.replica)).toHaveLength(0)
		await harness.close()
	})

	test('a modified stage runs the query on the pinned connection', async () => {
		const harness = createHarness({ latestTransactionId: 'tx-42' })

		const { result, koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token, 'x-contember-ref': 'tx-41' },
		})

		expect(statusOf(result)).toBeUndefined()
		expect(contentQueriesOf(harness.replica)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe(token)
		expect(harness.replica.clientsCreated()).toBe(1)
		await harness.close()
	})
})

describe('content api pinned connection error handling', () => {
	test('an application error is rethrown and the pooled connection survives', async () => {
		const harness = createHarness({
			notModifiedChecker: createMock<NotModifiedChecker>({
				checkNotModified: async () => {
					throw new Error('application boom')
				},
			}),
		})

		await expect(harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
		})).rejects.toThrow('application boom')

		await timeout()
		expect(harness.replica.clientsDisposed()).toBe(0)
		// the connection went back to the pool, so the next statement reuses the same physical client
		await harness.replica.connection.query('SELECT reuse')
		expect(harness.replica.clientsCreated()).toBe(1)
		await harness.close()
	})

	test('a content query whose statement breaks the connection disposes it, response or not', async () => {
		// graphql-js turns a failed resolver into a response, so nothing throws out of the request here
		const harness = createHarness({
			replicaFailQuery: sql => sql === contentMarker ? new Error('connection terminated unexpectedly') : undefined,
		})

		const { koa } = await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
		})

		expect(contentQueriesOf(harness.replica)).toHaveLength(1)
		expect(koa.response.get('X-Contember-Read-After-Visible')).toBe(token)
		expect(harness.replica.clientsDisposed()).toBe(1)
		await timeout()
		// the disposed connection is gone, the next statement has to establish a new one
		await harness.replica.connection.query('SELECT reuse')
		expect(harness.replica.clientsCreated()).toBe(2)
		await harness.close()
	})

	test('a content query that fails on a constraint keeps the pooled connection', async () => {
		const harness = createHarness({
			replicaFailQuery: sql => sql === contentMarker ? Object.assign(new Error('duplicate key'), { code: '23505' }) : undefined,
		})

		await harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token },
		})

		// a unique violation says nothing about the session - do not spend a good connection on it
		expect(harness.replica.clientsDisposed()).toBe(0)
		await timeout()
		await harness.replica.connection.query('SELECT reuse')
		expect(harness.replica.clientsCreated()).toBe(1)
		await harness.close()
	})

	test('a database error is rethrown and the pooled connection is disposed', async () => {
		const harness = createHarness({
			latestTransactionId: 'tx-42',
			replicaFailQuery: sql => sql.includes('"stage_transaction"') ? new Error('connection lost') : undefined,
		})

		await expect(harness.request({
			query: '{ marker }',
			headers: { 'x-contember-read-after': token, 'x-contember-ref': 'tx-42' },
		})).rejects.toThrow('connection lost')

		expect(harness.replica.clientsDisposed()).toBe(1)
		await timeout()
		// a disposed connection is gone, the next statement has to establish a new one
		await harness.replica.connection.query('SELECT reuse')
		expect(harness.replica.clientsCreated()).toBe(2)
		await harness.close()
	})
})
