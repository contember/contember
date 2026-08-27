import { describe, expect, test } from 'bun:test'
import { Client, Connection, EventManager, QueryError } from '@contember/database'
import { createLogger, Logger, TestLoggerHandler } from '@contember/logger'
import { isVisibleOnReplica, ReadAfterWriteResolver } from '../../../src/content/readAfterWrite/index.js'
import { ProjectConfig } from '../../../src/project/config.js'

type Responder = (sql: string, parameters: readonly unknown[]) => readonly Record<string, unknown>[]

/** In-memory stand-in for a database connection: records every statement and replays canned rows. */
class FakeConnection implements Connection.ConnectionType, Connection.AcquiredConnectionLike {
	public readonly eventManager = new EventManager()
	public readonly queries: { sql: string; parameters: readonly unknown[] }[] = []

	constructor(private readonly respond: Responder) {}

	async query<Row extends Record<string, any>>(sql: string, parameters: readonly unknown[] = []): Promise<Connection.Result<Row>> {
		this.queries.push({ sql, parameters })
		const rows = JSON.parse(JSON.stringify(this.respond(sql, parameters)))
		return { rows, rowCount: rows.length }
	}

	async scope<Result>(callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result): Promise<Result> {
		return await callback(this)
	}

	async transaction<Result>(): Promise<Result> {
		throw new Error('Transactions are not supported by this test double')
	}

	createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	getPoolStatus(): undefined {
		return undefined
	}

	on(): () => void {
		return () => {}
	}
}

const createTestLogger = (): { logger: Logger; handler: TestLoggerHandler } => {
	const handler = new TestLoggerHandler()
	return { logger: createLogger(handler), handler }
}

const levelsOf = (handler: TestLoggerHandler) => handler.messages.map(it => it.level.name)

describe('replica visibility probe', () => {
	test('an empty token list is visible without asking the database', async () => {
		const connection = new FakeConnection(() => [{ visible: false }])
		const { logger } = createTestLogger()

		expect(await isVisibleOnReplica(connection, [], logger)).toBe(true)
		expect(connection.queries).toHaveLength(0)
	})

	test('asks the replica with an xid8 array and returns its answer', async () => {
		const connection = new FakeConnection(() => [{ visible: true }])
		const { logger } = createTestLogger()

		expect(await isVisibleOnReplica(connection, ['1054', '1055'], logger)).toBe(true)
		expect(connection.queries).toHaveLength(1)
		expect(connection.queries[0].sql).toContain('pg_xact_status')
		expect(connection.queries[0].sql).toContain('pg_snapshot_xmax')
		expect(connection.queries[0].sql).toContain('xid8[]')
		expect(connection.queries[0].parameters).toStrictEqual([['1054', '1055']])
	})

	test('a negative answer is reported as not visible', async () => {
		const connection = new FakeConnection(() => [{ visible: false }])
		const { logger } = createTestLogger()

		expect(await isVisibleOnReplica(connection, ['1054'], logger)).toBe(false)
	})

	test('a missing row is reported as not visible', async () => {
		const connection = new FakeConnection(() => [])
		const { logger } = createTestLogger()

		expect(await isVisibleOnReplica(connection, ['1054'], logger)).toBe(false)
	})

	test('a failing probe warns with the server message only, never the tokens', async () => {
		const connection = new FakeConnection((sql, parameters) => {
			// what AcquiredConnection would raise: the message embeds the SQL and its parameters
			throw new QueryError(sql, parameters, Object.assign(new Error('terminating connection'), { code: '57P01' }))
		})
		const { logger, handler } = createTestLogger()

		expect(await isVisibleOnReplica(connection, ['1054'], logger)).toBe(false)
		expect(levelsOf(handler)).toStrictEqual(['warn'])
		expect(handler.messages[0].ownAttributes.errorCode).toBe('57P01')
		expect(handler.messages[0].ownAttributes.errorMessage).toBe('terminating connection')
		expect(JSON.stringify(handler.messages[0])).not.toContain('1054')
		expect(JSON.stringify(handler.messages[0])).not.toContain('pg_xact_status')
	})
})

const clusterId = '7412094958558216905'

const clusterRows = (version: number, cluster: string) => [{ version, cluster_id: cluster }]

const createProject = (read: ProjectConfig['db']['read']): ProjectConfig => ({
	slug: 'test',
	name: 'Test',
	stages: [{ slug: 'live', name: 'Live' }],
	db: {
		host: 'primary.example.com',
		port: 5432,
		user: 'contember',
		password: 'contember',
		database: 'contember',
		read,
	},
})

const createResolver = (
	{ project, primary, replica }: { project: ProjectConfig; primary: FakeConnection; replica?: FakeConnection },
) => {
	const { logger, handler } = createTestLogger()
	const resolver = new ReadAfterWriteResolver(project, primary, replica ?? primary, logger)
	return { resolver, handler }
}

describe('read-after-write resolver', () => {
	test('is disabled without a read replica, without querying', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const { resolver } = createResolver({ project: createProject(undefined), primary })

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(primary.queries).toHaveLength(0)
	})

	test('is disabled when the read connection is the primary one, without querying', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const { resolver } = createResolver({ project: createProject({ host: 'replica.example.com' }), primary })

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(primary.queries).toHaveLength(0)
	})

	test('is disabled by configuration, without querying', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, clusterId))
		const project = createProject({ host: 'replica.example.com', readAfterWrite: { enabled: false } })
		const { resolver } = createResolver({ project, primary, replica })

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(primary.queries).toHaveLength(0)
		expect(replica.queries).toHaveLength(0)
	})

	test('is enabled when both databases qualify', async () => {
		const primary = new FakeConnection(() => clusterRows(140000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, clusterId))
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: true, clusterId })
		expect(handler.messages).toHaveLength(0)
	})

	test('an explicit enabled: true is honoured', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, clusterId))
		const project = createProject({ host: 'replica.example.com', readAfterWrite: { enabled: true } })
		const { resolver } = createResolver({ project, primary, replica })

		expect(await resolver.resolve()).toStrictEqual({ enabled: true, clusterId })
	})

	test('an outdated replica disables the feature with one error', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => clusterRows(130000, clusterId))
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(levelsOf(handler)).toStrictEqual(['error'])
		expect(handler.messages[0].message).toContain('read replica')
		expect(handler.messages[0].message).toContain('130000')
		// the decision is cached, both databases were asked exactly once
		expect(primary.queries).toHaveLength(1)
		expect(replica.queries).toHaveLength(1)
	})

	test('an outdated primary disables the feature with one error', async () => {
		const primary = new FakeConnection(() => clusterRows(130000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, clusterId))
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(levelsOf(handler)).toStrictEqual(['error'])
		expect(handler.messages[0].message).toContain('primary')
	})

	test('a replica of another cluster disables the feature with one error', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, '999'))
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(levelsOf(handler)).toStrictEqual(['error'])
		expect(handler.messages[0].message).toContain('physical replica')
	})

	test('a database that answers pg_control_system() with no row is a permanent no', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => [])
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(levelsOf(handler)).toStrictEqual(['error'])
		expect(handler.messages[0].message).toContain('pg_control_system')
		// permanent, not retried
		expect(replica.queries).toHaveLength(1)
	})

	test('a failing check is not cached and is retried on the next request', async () => {
		let fail = true
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => {
			if (fail) {
				throw new Error('connection refused')
			}
			return clusterRows(160000, clusterId)
		})
		const { resolver, handler } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		expect(await resolver.resolve()).toStrictEqual({ enabled: false })
		expect(levelsOf(handler)).toStrictEqual(['warn'])

		fail = false
		expect(await resolver.resolve()).toStrictEqual({ enabled: true, clusterId })
		expect(replica.queries).toHaveLength(2)
	})

	test('concurrent first requests run the check once', async () => {
		const primary = new FakeConnection(() => clusterRows(160000, clusterId))
		const replica = new FakeConnection(() => clusterRows(160000, clusterId))
		const { resolver } = createResolver({
			project: createProject({ host: 'replica.example.com' }),
			primary,
			replica,
		})

		const results = await Promise.all([resolver.resolve(), resolver.resolve(), resolver.resolve()])

		expect(results).toStrictEqual([
			{ enabled: true, clusterId },
			{ enabled: true, clusterId },
			{ enabled: true, clusterId },
		])
		expect(primary.queries).toHaveLength(1)
		expect(replica.queries).toHaveLength(1)
	})
})
