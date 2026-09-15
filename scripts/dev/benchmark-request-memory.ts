import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { graphql } from 'graphql'
import { Connection, emptyDatabaseMetadata, EventManager, RequestMemoryBudget, RequestMemoryBudgetExceededError } from '@contember/database'
import { Authorizator, ExecutionContainerFactory, GraphQlSchemaBuilderFactory } from '@contember/engine-content-api'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { AllowAllPermissionFactory, emptySchema } from '@contember/schema-utils'

const databaseUrl = process.env.MEMORY_BENCH_DATABASE_URL
if (!databaseUrl) {
	throw new Error('Set MEMORY_BENCH_DATABASE_URL to a disposable local PostgreSQL database')
}
const url = new URL(databaseUrl)
const scenario = process.argv[2] ?? 'small-rows'
const mode = process.argv[3] ?? 'observe'
if (mode !== 'observe' && mode !== 'enforce' && mode !== 'off') {
	throw new Error('Mode must be observe, enforce, or off')
}
const scenarios = {
	'small-rows': { rows: 100_000, text: 16, json: false, nested: false, aliases: false, unicode: false },
	'long-text': { rows: 4000, text: 16_384, json: false, nested: false, aliases: false, unicode: false },
	'unicode': { rows: 4000, text: 8192, json: false, nested: false, aliases: false, unicode: true },
	'json': { rows: 10_000, text: 128, json: true, nested: false, aliases: false, unicode: false },
	'nested': { rows: 1000, text: 512, json: false, nested: true, aliases: false, unicode: false },
	'aliases': { rows: 10_000, text: 512, json: false, nested: false, aliases: true, unicode: false },
	'single-value': { rows: 1, text: 16 * 1024 * 1024, json: false, nested: false, aliases: false, unicode: false },
}
function getScenario(name: string) {
	for (const [key, value] of Object.entries(scenarios)) {
		if (key === name) {
			return value
		}
	}
	throw new Error(`Unknown scenario: ${name}`)
}
const fixture = getScenario(scenario)
const connection = Connection.create({
	host: url.hostname,
	port: Number(url.port || 5432),
	user: decodeURIComponent(url.username),
	password: decodeURIComponent(url.password),
	database: url.pathname.slice(1),
	pool: { maxConnections: 4, idleTimeoutMs: 50, rateLimitPeriodMs: 50 },
}, error => console.error(error))
const schemaName = `memory_bench_${randomUUID().replaceAll('-', '')}`
const setup = connection.createClient(schemaName, {})
const model = new SchemaBuilder()
	.entity('Item', entity =>
		entity
			.column('body', column => column.type(Model.ColumnType.String))
			.column('payload', column => column.type(Model.ColumnType.Json))
			.column('position', column => column.type(Model.ColumnType.Int)))
	.entity('Child', entity =>
		entity
			.column('body', column => column.type(Model.ColumnType.String))
			.manyHasOne('item', relation => relation.target('Item').inversedBy('children')))
	.buildSchema()
const permissions = new AllowAllPermissionFactory().create(model)
const gqlSchema = new GraphQlSchemaBuilderFactory().create(model, new Authorizator(permissions, false, false)).build()
const factory = new ExecutionContainerFactory({ uuid: () => randomUUID(), now: () => new Date() })

try {
	await setup.query(`CREATE SCHEMA "${schemaName}"`)
	await setup.query(`CREATE TABLE "${schemaName}".item (id uuid PRIMARY KEY, body text, payload jsonb, position integer)`)
	await setup.query(`CREATE TABLE "${schemaName}".child (id uuid PRIMARY KEY, body text, item_id uuid)`)
	await setup.query(
		`INSERT INTO "${schemaName}".item
		SELECT md5(i::text)::uuid, repeat(?, ?),
		CASE WHEN ? THEN jsonb_build_object('values', (SELECT jsonb_agg(jsonb_build_object('index', n, 'text', repeat('j', 128))) FROM generate_series(1, 20) n)) ELSE NULL END,
		i FROM generate_series(1, ?) i`,
		[fixture.unicode ? 'ž漢' : 'x', fixture.text, fixture.json, fixture.rows],
	)
	if (fixture.nested) {
		await setup.query(
			`INSERT INTO "${schemaName}".child
			SELECT md5(i::text || ':' || n::text)::uuid, repeat('c', 512), md5(i::text)::uuid
			FROM generate_series(1, ?) i CROSS JOIN generate_series(1, 40) n`,
			[fixture.rows],
		)
	}
	const selection = `id position body ${fixture.json ? 'payload' : ''} ${fixture.nested ? 'children { id body }' : ''}`
	const source = fixture.aliases
		? `{ first: listItem { ${selection} } second: listItem { ${selection} } third: listItem { ${selection} } }`
		: `{ listItem { ${selection} } }`
	const budget = mode === 'off' ? undefined : new RequestMemoryBudget({
		warnBytes: 4 * 1024 * 1024,
		maxBytes: mode === 'enforce' ? 8 * 1024 * 1024 : 1024 * 1024 * 1024,
	})
	const db = budget ? setup.withMemoryBudget(budget) : setup
	const executionContainer = factory.create({
		db,
		schema: { ...emptySchema, model },
		schemaMeta: {},
		schemaDatabaseMetadata: emptyDatabaseMetadata,
		identityId: randomUUID(),
		identityVariables: {},
		permissions,
		systemSchema: schemaName,
		project: { slug: 'memory-benchmark' },
		stage: { id: randomUUID(), slug: 'live' },
		userInfo: { ipAddress: null, userAgent: null },
	})
	const contextValue = { db, executionContainer, identityVariables: {}, timer: <T>(label: string, callback: () => T) => callback() }
	await graphql({ schema: gqlSchema, source: '{ listItem(limit: 1) { id } }', contextValue })
	if (!globalThis.gc) {
		throw new Error('Run with --expose-gc')
	}
	globalThis.gc()
	const baseline = process.memoryUsage()
	let sampledHeapPeak = baseline.heapUsed
	let sampledRssPeak = baseline.rss
	const sample = () => {
		const memory = process.memoryUsage()
		sampledHeapPeak = Math.max(sampledHeapPeak, memory.heapUsed)
		sampledRssPeak = Math.max(sampledRssPeak, memory.rss)
	}
	db.eventManager.on(EventManager.Event.queryEnd, sample)
	const sampling = setInterval(sample, 5)
	const start = performance.now()
	try {
		const response = await graphql({ schema: gqlSchema, source, contextValue })
		const executionMs = performance.now() - start
		sample()
		const accountingStart = performance.now()
		budget?.prepareResponse(response.data)
		const completionAccountingMs = performance.now() - accountingStart
		sample()
		if (response.errors) {
			throw response.errors[0]
		}
		const afterExecution = process.memoryUsage().heapUsed - baseline.heapUsed
		const serializationStart = performance.now()
		const json = JSON.stringify(response)
		const serializationMs = performance.now() - serializationStart
		sample()
		const afterSerialization = process.memoryUsage().heapUsed - baseline.heapUsed
		const durationMs = performance.now() - start
		globalThis.gc()
		const retainedWithResponse = process.memoryUsage().heapUsed - baseline.heapUsed
		console.log(JSON.stringify({
			scenario,
			mode,
			runtime: process.version,
			rows: fixture.rows,
			responseBytes: Buffer.byteLength(json),
			heapAfterExecution: afterExecution,
			heapAfterSerialization: afterSerialization,
			heapRetainedWithResponse: retainedWithResponse,
			sampledHeapPeakDelta: sampledHeapPeak - baseline.heapUsed,
			sampledRssPeakDelta: sampledRssPeak - baseline.rss,
			executionMs,
			completionAccountingMs,
			serializationMs,
			durationMs,
			budget: budget?.snapshot(),
		}))
	} catch (error) {
		if (!(error instanceof RequestMemoryBudgetExceededError)) {
			throw error
		}
		sample()
		console.log(
			JSON.stringify({ scenario, mode, aborted: true, sampledHeapPeakDelta: sampledHeapPeak - baseline.heapUsed, budget: budget?.snapshot() }),
		)
		const healthy = await setup.query<{ value: number }>('SELECT 1 AS value')
		if (healthy.rows[0]?.value !== 1) {
			throw new Error('Pool did not recover after budget cancellation')
		}
	} finally {
		clearInterval(sampling)
	}
} finally {
	await setup.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
	await connection.end()
}
