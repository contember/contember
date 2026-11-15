import { afterEach, expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { Connection, wrapIdentifier } from '@contember/database'
import { Migration, MigrationsResolver, MigrationsRunner } from '@contember/database-migrations'

// The system and tenant schemas are migrated by this runner against databases that already record earlier migrations.
// It lives here because the CI job with PostgreSQL runs this directory.
const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL
const databaseTest = test.skipIf(!databaseUrl)
const schema = 'system'
const migrationsTable = `${wrapIdentifier(schema)}."migrations"`

const connectionConfig = (database: string) => {
	if (!databaseUrl) {
		throw new Error('Set MIGRATION_TEST_DATABASE_URL to a local PostgreSQL server')
	}
	const url = new URL(databaseUrl)
	return {
		host: url.hostname,
		port: Number(url.port || 5432),
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database,
	}
}

const maintenance = async (sql: string) => {
	const connection = Connection.createSingle(connectionConfig(new URL(databaseUrl ?? '').pathname.slice(1) || 'postgres'), error => {
		throw error
	})
	try {
		await connection.query(sql)
	} finally {
		await connection.end()
	}
}

const createdDatabases: string[] = []
afterEach(async () => {
	for (const database of createdDatabases.splice(0)) {
		await maintenance('DROP DATABASE IF EXISTS ' + wrapIdentifier(database))
	}
})

const createDatabase = async (): Promise<Connection> => {
	const database = `mre_${crypto.randomBytes(4).toString('hex')}`
	await maintenance('CREATE DATABASE ' + wrapIdentifier(database))
	createdDatabases.push(database)
	return Connection.createSingle(connectionConfig(database), error => {
		throw error
	})
}

const first = new Migration('2020-01-01-000000-first', builder => {
	builder.createTable('item', { id: { primaryKey: true, type: 'int' } })
})
const second = new Migration('2020-01-02-000000-second', builder => {
	builder.addColumn('item', { name: { type: 'text' } })
})
const third = new Migration('2020-01-03-000000-third', builder => {
	builder.addColumn('item', { note: { type: 'text' } })
})
const plugin = new Migration('2020-01-03-000000-plugin', builder => {
	builder.sql('CREATE TABLE "plugin_item" ("id" int PRIMARY KEY)')
}, 'plugin')

const listResolver = (migrations: Migration[]): MigrationsResolver<unknown> => ({ resolveMigrations: () => migrations })

const migrate = (connection: Connection, migrations: Migration[]) =>
	new MigrationsRunner(connection, schema, listResolver(migrations)).migrate(() => null, {})

type RecordedRow = { id: number; name: string; run_on: Date; group: string | null }
const recordedRows = async (connection: Connection) =>
	(await connection.query<RecordedRow>(`SELECT id, name, run_on, "group" FROM ${migrationsTable} ORDER BY id`)).rows

const itemColumns = async (connection: Connection) =>
	(await connection.query<{ column_name: string }>(
		`SELECT column_name FROM information_schema.columns WHERE table_schema = 'system' AND table_name = 'item' ORDER BY ordinal_position`,
	)).rows.map(it => it.column_name)

databaseTest('runs only the migrations a table recorded by this runner lacks', async () => {
	const connection = await createDatabase()
	try {
		expect(await migrate(connection, [first, second])).toEqual([{ name: first.name }, { name: second.name }])
		const before = await recordedRows(connection)

		expect(await migrate(connection, [first, second, third, plugin])).toEqual([{ name: third.name }, { name: plugin.name }])

		const after = await recordedRows(connection)
		expect(after.slice(0, 2)).toEqual(before)
		expect(after.slice(2).map(({ id, name, group }) => ({ id, name, group }))).toEqual([
			{ id: 3, name: third.name, group: null },
			{ id: 4, name: plugin.name, group: 'plugin' },
		])
		expect(await itemColumns(connection)).toEqual(['id', 'name', 'note'])

		expect(await migrate(connection, [first, second, third, plugin])).toEqual([])
		expect(await recordedRows(connection)).toEqual(after)
	} finally {
		await connection.end()
	}
})

databaseTest('adopts a migrations table created with a serial id and no group column', async () => {
	const connection = await createDatabase()
	try {
		await connection.query(`CREATE SCHEMA ${wrapIdentifier(schema)}`)
		await connection.query(`CREATE TABLE ${migrationsTable} (id SERIAL PRIMARY KEY, name varchar(255) NOT NULL, run_on timestamp NOT NULL)`)
		await connection.query(`INSERT INTO ${migrationsTable} (name, run_on) VALUES ('${first.name}', NOW()), ('${second.name}', NOW())`)
		await connection.query(`CREATE TABLE ${wrapIdentifier(schema)}."item" ("id" int PRIMARY KEY, "name" text)`)
		const before = (await connection.query<{ id: number; name: string; run_on: Date }>(`SELECT id, name, run_on FROM ${migrationsTable} ORDER BY id`))
			.rows

		expect(await migrate(connection, [first, second, third])).toEqual([{ name: third.name }])

		const after = await recordedRows(connection)
		expect(after.slice(0, 2)).toEqual(before.map(row => ({ ...row, group: null })))
		expect(after.slice(2).map(({ id, name, group }) => ({ id, name, group }))).toEqual([{ id: 3, name: third.name, group: null }])
		expect(await itemColumns(connection)).toEqual(['id', 'name', 'note'])
		const sequence = await connection.query<{ seq: string | null }>(`SELECT pg_get_serial_sequence('${migrationsTable}', 'id') AS seq`)
		expect(sequence.rows).toEqual([{ seq: null }])
	} finally {
		await connection.end()
	}
})
