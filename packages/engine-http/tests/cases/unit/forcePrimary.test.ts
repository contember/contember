import { expect, spyOn, test } from 'bun:test'
import { Client as PgClient } from 'pg'
import Koa from 'koa'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { GraphQLError, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { Connection, emptyDatabaseMetadata, EventManager, Pool } from '@contember/database'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { ExecutionContainerFactory } from '@contember/engine-content-api'
import { emptySchema } from '@contember/schema-utils'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { createMock } from '../../utils.js'
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
import { TestTransactionService } from '../../../src/testing/index.js'
import { createProviders } from '../../../src/providers.js'
import { HttpResponse } from '../../../src/common/index.js'

const unavailable = (): never => {
	throw new Error('Unused test dependency')
}
const stage = { id: 'a4c9b8f2-6a1e-4a3f-9a4b-1f2e3d4c5b6a', name: 'Live', slug: 'live', schema: 'stage_live' }

const createHarness = ({ forcePrimaryHeader = true, withReplica = true }: { forcePrimaryHeader?: boolean; withReplica?: boolean } = {}) => {
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
	const marker = {
		type: GraphQLString,
		resolve: async (_source: unknown, _args: unknown, context: ContentGraphqlContext) => {
			const result = await context.db.query<{ marker: string }>('SELECT marker')
			return result.rows[0].marker
		},
	}
	const schema = new GraphQLSchema({
		query: new GraphQLObjectType({ name: 'Query', fields: { marker } }),
		mutation: new GraphQLObjectType({
			name: 'Mutation',
			fields: {
				marker,
				fail: {
					type: GraphQLString,
					resolve: () => {
						throw new GraphQLError('Mutation failed')
					},
				},
			},
		}),
	})
	const controller = new ContentApiControllerFactory(
		new NotModifiedChecker(),
		new ExecutionContainerFactory(providers),
		new ContentQueryHandlerFactory(false),
		createMock<ProjectContextResolver>({ resolve: async () => ({ projectContainer, project }) }),
		createMock<GraphQlSchemaFactory>({ create: () => ({ schema, permissions: {}, allPermissions: {} }) }),
		new TestTransactionService(false),
		forcePrimaryHeader,
	).create()
	const projectGroup: ProjectGroupContainer = {
		slug: undefined,
		logger,
		projectMembershipResolver: createMock<ProjectMembershipResolver>({ resolveMemberships: async () => ({ effective: [], fetched: [] }) }),
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
		request: async (query: string, headers: Record<string, string> = {}) => {
			const message = new IncomingMessage(new Socket())
			message.method = 'POST'
			message.url = '/content/test/live'
			message.headers = headers
			const response = new ServerResponse(message)
			const koa = new Koa().createContext(message, response)
			const body = { query }
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
				requestDebugMode: false,
				authResult: { valid: true, identityId: 'identity', apiKeyId: 'key', roles: [], personId: null, trustForwardedInfo: false },
				params: { projectSlug: 'test', stageSlug: 'live' },
			})
			return { koa, result }
		},
	}
}

test('force-primary routes preparation, cache validation and content to primary even with an unavailable replica', async () => {
	const harness = createHarness()
	try {
		harness.setReplicaUnavailable()
		const { koa, result } = await harness.request('{ marker }', { 'x-contember-force-primary': '1', 'x-contember-ref': 'old-ref' })
		expect(result).toBeUndefined()
		expect(koa.body).toBe('{"data":{"marker":"primary"}}')
		expect(koa.response.get('X-Contember-Mutation')).toBe('')
		expect(harness.statements.every(it => it.side === 'primary')).toBe(true)
		expect(harness.statements.some(it => it.sql.includes('"stage_transaction"'))).toBe(true)
		expect(harness.preparation).toEqual([harness.primarySystem, harness.primarySystem])
	} finally {
		await harness.close()
	}
})

test('a forced primary read can return 304 from the primary reference', async () => {
	const harness = createHarness()
	try {
		const { result } = await harness.request('{ marker }', { 'x-contember-force-primary': '1', 'x-contember-ref': 'new-ref' })
		expect(result).toBeInstanceOf(HttpResponse)
		expect(result instanceof HttpResponse && result.code).toBe(304)
		expect(harness.statements.some(it => it.sql === 'SELECT marker')).toBe(false)
	} finally {
		await harness.close()
	}
})

test('without the header, preparation, cache validation and content read the replica', async () => {
	const harness = createHarness()
	try {
		const { koa } = await harness.request('{ marker }', { 'x-contember-ref': 'new-ref' })
		expect(koa.body).toBe('{"data":{"marker":"replica"}}')
		expect(harness.statements.every(it => it.side === 'replica')).toBe(true)
		expect(harness.statements.some(it => it.sql.includes('"stage_transaction"'))).toBe(true)
		expect(harness.preparation).toEqual([harness.replicaSystem, harness.replicaSystem])
	} finally {
		await harness.close()
	}
})

test('the header accepts the same truthy values as X-Contember-Force-Ok; ordinary queries still read the replica', async () => {
	const harness = createHarness()
	try {
		for (const value of ['1', 'true', ' ON ', 'yes']) {
			const { koa } = await harness.request('{ marker }', { 'x-contember-force-primary': value })
			expect(koa.body).toBe('{"data":{"marker":"primary"}}')
		}
		const headerCases: Record<string, string>[] = [{}, { 'x-contember-force-primary': '0' }, { 'x-contember-force-primary': 'false' }]
		for (const headers of headerCases) {
			const { koa } = await harness.request('{ marker }', headers)
			expect(koa.body).toBe('{"data":{"marker":"replica"}}')
		}
	} finally {
		await harness.close()
	}
})

test('without the config opt-in the header is ignored and mutations are not marked', async () => {
	const harness = createHarness({ forcePrimaryHeader: false })
	try {
		const query = await harness.request('{ marker }', { 'x-contember-force-primary': '1' })
		expect(query.koa.body).toBe('{"data":{"marker":"replica"}}')
		expect(harness.statements.every(it => it.side === 'replica')).toBe(true)
		expect(harness.preparation).toEqual([harness.replicaSystem, harness.replicaSystem])
		const mutation = await harness.request('mutation { marker }')
		expect(mutation.koa.body).toBe('{"data":{"marker":"primary"}}')
		expect(mutation.koa.response.get('X-Contember-Mutation')).toBe('')
	} finally {
		await harness.close()
	}
})

test('mutations run on primary and are marked even when a later root fails', async () => {
	const harness = createHarness()
	try {
		const { koa } = await harness.request('mutation { marker fail }')
		expect(koa.response.get('X-Contember-Mutation')).toBe('1')
		expect(koa.body).toContain('"marker":"primary"')
		expect(koa.body).toContain('Mutation failed')
		const invalid = await harness.request('mutation { unknown }')
		expect(invalid.koa.response.get('X-Contember-Mutation')).toBe('')
	} finally {
		await harness.close()
	}
})

test('a project without a read replica does not mark mutations', async () => {
	const harness = createHarness({ withReplica: false })
	try {
		const { koa } = await harness.request('mutation { marker }')
		expect(koa.body).toBe('{"data":{"marker":"primary"}}')
		expect(koa.response.get('X-Contember-Mutation')).toBe('')
	} finally {
		await harness.close()
	}
})
