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
const measurement = process.argv[4] ?? 'sampled'
if (measurement !== 'sampled' && measurement !== 'retained') {
	throw new Error('Measurement must be sampled or retained')
}
const jsc = typeof Bun === 'undefined' ? undefined : await import('bun:jsc')
const readHeap = jsc ? () => jsc.heapSize() : () => process.memoryUsage().heapUsed
if (mode !== 'observe' && mode !== 'enforce' && mode !== 'off') {
	throw new Error('Mode must be observe, enforce, or off')
}
interface Fixture {
	rows: number
	text: number
	json: boolean
	nested: boolean
	aliases: boolean
	unicode: boolean
	// Repeats the request in one process with a fresh budget each time; a single small request is below timer resolution.
	iterations?: number
}
const scenarios: Record<string, Fixture> = {
	'small-rows': { rows: 100_000, text: 16, json: false, nested: false, aliases: false, unicode: false },
	'long-text': { rows: 4000, text: 16_384, json: false, nested: false, aliases: false, unicode: false },
	'latin1': { rows: 4000, text: 8192, json: false, nested: false, aliases: false, unicode: false },
	'mixed-text': { rows: 4000, text: 16_384, json: false, nested: false, aliases: false, unicode: false },
	'escaped-text': { rows: 4000, text: 4096, json: false, nested: false, aliases: false, unicode: false },
	'unicode': { rows: 4000, text: 8192, json: false, nested: false, aliases: false, unicode: true },
	'json': { rows: 10_000, text: 128, json: true, nested: false, aliases: false, unicode: false },
	'nested': { rows: 1000, text: 512, json: false, nested: true, aliases: false, unicode: false },
	'aliases': { rows: 10_000, text: 512, json: false, nested: false, aliases: true, unicode: false },
	'single-value': { rows: 1, text: 16 * 1024 * 1024, json: false, nested: false, aliases: false, unicode: false },
	'medium-rows': { rows: 20_000, text: 256, json: false, nested: false, aliases: false, unicode: false },
	'few-large-rows': { rows: 128, text: 65_536, json: false, nested: false, aliases: false, unicode: false },
	'small-json': { rows: 1000, text: 256, json: true, nested: false, aliases: false, unicode: false },
	'field-aliases': { rows: 4000, text: 16_384, json: false, nested: false, aliases: false, unicode: false },
	'heterogeneous-json': { rows: 2000, text: 128, json: true, nested: false, aliases: false, unicode: false },
	'typical-detail': { rows: 1, text: 256, json: false, nested: false, aliases: false, unicode: false, iterations: 5000 },
	'typical-list': { rows: 50, text: 256, json: false, nested: false, aliases: false, unicode: false, iterations: 2000 },
	'typical-json': { rows: 50, text: 256, json: true, nested: false, aliases: false, unicode: false, iterations: 1000 },
	'typical-nested': { rows: 10, text: 256, json: false, nested: true, aliases: false, unicode: false, iterations: 1000 },
}
function getScenario(name: string): Fixture {
	if (!Object.hasOwn(scenarios, name)) {
		throw new Error(`Unknown scenario: ${name}`)
	}
	return scenarios[name]
}
const fixture = getScenario(scenario)
const text = scenario === 'latin1' ? 'éñ' : scenario === 'escaped-text' ? '\u0001\n"\\' : fixture.unicode ? 'ž漢' : 'x'
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
		SELECT md5(i::text)::uuid, repeat(?, ?) || CASE WHEN ? AND i = 1 THEN '漢' ELSE '' END,
		CASE WHEN ? THEN CASE WHEN ? AND i > ?
		THEN jsonb_build_object('values', (SELECT jsonb_agg(0) FROM generate_series(1, 1500)))
		ELSE jsonb_build_object('values', (SELECT jsonb_agg(jsonb_build_object('index', n, 'text', repeat('j', 128))) FROM generate_series(1, 20) n)) END ELSE NULL END,
		i FROM generate_series(1, ?) i`,
		[text, fixture.text, scenario === 'mixed-text', fixture.json, scenario === 'heterogeneous-json', Math.floor(fixture.rows / 2), fixture.rows],
	)
	if (fixture.nested) {
		await setup.query(
			`INSERT INTO "${schemaName}".child
			SELECT md5(i::text || ':' || n::text)::uuid, repeat('c', 512), md5(i::text)::uuid
			FROM generate_series(1, ?) i CROSS JOIN generate_series(1, 40) n`,
			[fixture.rows],
		)
	}
	const selection = `id position body ${scenario === 'field-aliases' ? 'copy1: body copy2: body' : ''} ${fixture.json ? 'payload' : ''} ${
		fixture.nested ? 'children { id body }' : ''
	}`
	const source = fixture.aliases
		? `{ first: listItem { ${selection} } second: listItem { ${selection} } third: listItem { ${selection} } }`
		: `{ listItem { ${selection} } }`
	const createBudget = () =>
		mode === 'off' ? undefined : new RequestMemoryBudget({
			warnBytes: 4 * 1024 * 1024,
			maxBytes: mode === 'enforce' ? 8 * 1024 * 1024 : 1024 * 1024 * 1024,
		})
	const createContextValue = (budget: RequestMemoryBudget | undefined) => {
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
		return { db, executionContainer, identityVariables: {}, timer: <T>(label: string, callback: () => T) => callback() }
	}
	if (fixture.iterations !== undefined) {
		if (mode === 'enforce') {
			throw new Error('Repeated scenarios measure overhead only; use observe or off')
		}
		const runRequest = async () => {
			const budget = createBudget()
			const response = await graphql({ schema: gqlSchema, source, contextValue: createContextValue(budget) })
			budget?.check()
			if (response.errors) {
				throw response.errors[0]
			}
			return { responseBytes: Buffer.byteLength(JSON.stringify(response)), budget }
		}
		for (let i = 0; i < fixture.iterations / 10; i++) {
			await runRequest()
		}
		const start = performance.now()
		const cpuStart = process.cpuUsage()
		let last = await runRequest()
		for (let i = 1; i < fixture.iterations; i++) {
			last = await runRequest()
		}
		const durationMs = performance.now() - start
		const cpu = process.cpuUsage(cpuStart)
		console.log(JSON.stringify({
			scenario,
			mode,
			runtime: typeof Bun === 'undefined' ? `node ${process.version}` : `bun ${Bun.version}`,
			rows: fixture.rows,
			iterations: fixture.iterations,
			responseBytes: last.responseBytes,
			durationMs,
			cpuMs: (cpu.user + cpu.system) / 1000,
			budget: last.budget?.snapshot(),
		}))
	} else {
		const budget = createBudget()
		const contextValue = createContextValue(budget)
		const db = contextValue.db
		await graphql({ schema: gqlSchema, source: '{ listItem(limit: 1) { id } }', contextValue })
		if (!globalThis.gc) {
			throw new Error('Run with --expose-gc')
		}
		const collectGarbage = jsc ? () => jsc.gcAndSweep() : globalThis.gc
		collectGarbage()
		const baseline = process.memoryUsage()
		const baselineHeap = readHeap()
		let sampledHeapPeak = baselineHeap
		let sampledRssPeak = baseline.rss
		const sample = () => {
			if (measurement === 'retained') {
				collectGarbage()
			}
			const memory = process.memoryUsage()
			sampledHeapPeak = Math.max(sampledHeapPeak, readHeap())
			sampledRssPeak = Math.max(sampledRssPeak, memory.rss)
		}
		db.eventManager.on(EventManager.Event.queryEnd, sample)
		const sampling = measurement === 'sampled' ? setInterval(sample, 5) : undefined
		const start = performance.now()
		const cpuStart = process.cpuUsage()
		try {
			const response = await graphql({ schema: gqlSchema, source, contextValue })
			const executionMs = performance.now() - start
			sample()
			budget?.check()
			if (response.errors) {
				throw response.errors[0]
			}
			const afterExecution = readHeap() - baselineHeap
			const serializationStart = performance.now()
			const json = JSON.stringify(response)
			const serializationMs = performance.now() - serializationStart
			sample()
			const afterSerialization = readHeap() - baselineHeap
			const durationMs = performance.now() - start
			const cpu = process.cpuUsage(cpuStart)
			collectGarbage()
			const retainedWithResponse = readHeap() - baselineHeap
			sampledHeapPeak = Math.max(sampledHeapPeak, baselineHeap + retainedWithResponse)
			console.log(JSON.stringify({
				scenario,
				mode,
				measurement,
				heapSource: jsc ? 'bun:jsc.heapSize' : 'process.memoryUsage.heapUsed',
				runtime: typeof Bun === 'undefined' ? `node ${process.version}` : `bun ${Bun.version}`,
				rows: fixture.rows,
				responseBytes: Buffer.byteLength(json),
				serializedHeapBytes: jsc?.estimateShallowMemoryUsageOf(json),
				responseRootFields: Object.keys(response.data ?? {}),
				heapAfterExecution: afterExecution,
				heapAfterSerialization: afterSerialization,
				heapRetainedWithResponse: retainedWithResponse,
				sampledHeapPeakDelta: sampledHeapPeak - baselineHeap,
				sampledRssPeakDelta: sampledRssPeak - baseline.rss,
				executionMs,
				serializationMs,
				durationMs,
				cpuMs: (cpu.user + cpu.system) / 1000,
				budget: budget?.snapshot(),
			}))
		} catch (error) {
			if (!(error instanceof RequestMemoryBudgetExceededError)) {
				throw error
			}
			sample()
			console.log(
				JSON.stringify({
					scenario,
					mode,
					measurement,
					runtime: typeof Bun === 'undefined' ? `node ${process.version}` : `bun ${Bun.version}`,
					aborted: true,
					sampledHeapPeakDelta: sampledHeapPeak - baselineHeap,
					budget: budget?.snapshot(),
				}),
			)
			const healthy = await setup.query<{ value: number }>('SELECT 1 AS value')
			if (healthy.rows[0]?.value !== 1) {
				throw new Error('Pool did not recover after budget cancellation')
			}
		} finally {
			clearInterval(sampling)
		}
	}
} finally {
	await setup.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
	await connection.end()
}
