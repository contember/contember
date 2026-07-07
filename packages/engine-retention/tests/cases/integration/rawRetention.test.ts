import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { Client, Connection, wrapIdentifier } from '@contember/database'
import { c, createSchema } from '@contember/schema-definition'
import { getEntity } from '@contember/schema-utils'
import { createWhereBuilder, PathFactory } from '@contember/engine-content-api'
import { Retention } from '@contember/schema'
import { RawRetentionExecutor } from '../../../src/RawRetentionExecutor.js'

/**
 * Live-Postgres proof that the `raw` strategy actually prunes rows. It runs only where the repo's
 * `TEST_DB_*` env is present (the docker `engine`/`cli` container in CI, per `docker-compose`), and
 * skips cleanly otherwise — it never fabricates a pass without a database. Mirrors the tenant tests'
 * `TEST_DB_*` connection convention.
 */
const hasDb = Boolean(process.env.TEST_DB_HOST)

namespace RetentionModel {
	export class Token {
		used = c.boolColumn()
		expiresAt = c.dateTimeColumn()
	}
}

const schema = createSchema(RetentionModel)
const model = schema.model
const entity = getEntity(model, 'Token')
const STAGE_SCHEMA = 'stage_live'
const TEST_DB = 'contember_retention_it'

const credentials = (database: string) => ({
	host: String(process.env.TEST_DB_HOST),
	port: Number(process.env.TEST_DB_PORT),
	user: String(process.env.TEST_DB_USER),
	password: String(process.env.TEST_DB_PASSWORD),
	database,
})

const policy = (olderThan?: Retention.Policy['olderThan'], where?: Retention.Policy['where']): Retention.Policy => ({
	name: 'test',
	entity: 'Token',
	strategy: 'raw',
	olderThan,
	where,
})

describe.skipIf(!hasDb)('raw retention against a live database', () => {
	let maintenance: Connection
	let connection: Connection
	let client: Client
	const executor = new RawRetentionExecutor(createWhereBuilder(model), new PathFactory())

	const count = async (): Promise<number> => {
		const res = await client.query<{ c: number }>(
			`select count(*)::int as c from ${wrapIdentifier(STAGE_SCHEMA)}.${wrapIdentifier(entity.tableName)}`,
			[],
		)
		return res.rows[0].c
	}

	const insert = async (used: boolean, expiresSql: string, times: number): Promise<void> => {
		for (let i = 0; i < times; i++) {
			await client.query(
				`insert into ${wrapIdentifier(STAGE_SCHEMA)}.${wrapIdentifier(entity.tableName)} ("used", "expires_at") values (?, ${expiresSql})`,
				[used],
			)
		}
	}

	beforeAll(async () => {
		maintenance = Connection.create(credentials(process.env.TEST_DB_MAINTENANCE_NAME || 'postgres'), () => null)
		await maintenance.query(`drop database if exists ${wrapIdentifier(TEST_DB)}`, [])
		await maintenance.query(`create database ${wrapIdentifier(TEST_DB)}`, [])
		connection = Connection.create({ ...credentials(TEST_DB), pool: { maxConnections: 1 } }, () => null)
		client = connection.createClient(STAGE_SCHEMA, {})
		await client.query(`create schema ${wrapIdentifier(STAGE_SCHEMA)}`, [])
		await client.query(
			`create table ${wrapIdentifier(STAGE_SCHEMA)}.${wrapIdentifier(entity.tableName)} (`
				+ `${wrapIdentifier(entity.primaryColumn)} uuid primary key default gen_random_uuid(), `
				+ `"used" boolean not null, "expires_at" timestamptz not null)`,
			[],
		)
	})

	afterAll(async () => {
		await connection?.end()
		await maintenance?.query(`drop database if exists ${wrapIdentifier(TEST_DB)}`, [])
		await maintenance?.end()
	})

	beforeEach(async () => {
		await client.query(`truncate ${wrapIdentifier(STAGE_SCHEMA)}.${wrapIdentifier(entity.tableName)}`, [])
	})

	test('olderThan prunes rows past the cutoff and keeps the rest', async () => {
		await insert(true, `now() - interval '40 days'`, 3)
		await insert(true, `now() + interval '1 day'`, 2)

		const deleted = await executor.execute(client, entity, policy({ field: 'expiresAt', interval: '30 days' }), { batchSize: 1000, maxPerRun: 100_000 })

		expect(deleted).toBe(3)
		expect(await count()).toBe(2)
	})

	test('where is ANDed with olderThan', async () => {
		await insert(true, `now() - interval '40 days'`, 2) // old + used ⇒ deleted
		await insert(false, `now() - interval '40 days'`, 3) // old but not used ⇒ kept
		await insert(true, `now() + interval '1 day'`, 1) // used but fresh ⇒ kept

		const deleted = await executor.execute(
			client,
			entity,
			policy({ field: 'expiresAt', interval: '30 days' }, { used: { eq: true } }),
			{ batchSize: 1000, maxPerRun: 100_000 },
		)

		expect(deleted).toBe(2)
		expect(await count()).toBe(4)
	})

	test('maxPerRun caps deletion across batches', async () => {
		await insert(true, `now() - interval '40 days'`, 5)

		const deleted = await executor.execute(client, entity, policy({ field: 'expiresAt', interval: '30 days' }), { batchSize: 2, maxPerRun: 3 })

		expect(deleted).toBe(3)
		expect(await count()).toBe(2)
	})
})
