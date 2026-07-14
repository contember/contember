import { expect, test } from 'bun:test'
import { Client, Connection, SerializationFailureError, wrapIdentifier } from '@contember/database'

const databaseHost = process.env.TEST_DB_HOST
const runDatabaseTest = test.skipIf(databaseHost === undefined)

const createClient = () => {
	if (databaseHost === undefined) {
		throw new Error('TEST_DB_HOST is required')
	}
	const connection = Connection.create({
		host: databaseHost,
		port: Number(process.env.TEST_DB_PORT ?? 5432),
		user: process.env.TEST_DB_USER ?? 'postgres',
		password: process.env.TEST_DB_PASSWORD ?? 'postgres',
		database: process.env.TEST_DB_NAME ?? 'postgres',
		statementTimeoutMs: 5000,
		queryTimeoutMs: 5000,
	}, error => {
		throw error
	})
	return { connection, client: connection.createClient('public', {}) }
}

const createBarrier = (participants: number): () => Promise<void> => {
	let arrived = 0
	let release = () => {}
	const released = new Promise<void>(resolve => {
		release = resolve
	})
	return async () => {
		arrived++
		if (arrived === participants) {
			release()
		}
		await released
	}
}

const withSchema = async (cb: (client: Client, schema: string) => Promise<void>): Promise<void> => {
	const { connection, client } = createClient()
	const schema = `concurrency_${Date.now()}_${Math.random().toString(36).slice(2)}`
	try {
		await client.query(`CREATE SCHEMA ${wrapIdentifier(schema)}`)
		await cb(client.forSchema(schema), schema)
	} finally {
		await client.query(`DROP SCHEMA IF EXISTS ${wrapIdentifier(schema)} CASCADE`)
		await connection.end()
	}
}

runDatabaseTest('PostgreSQL deadlocks are exposed as retryable serialization failures', async () => {
	await withSchema(async (client, schema) => {
		const resource = `${wrapIdentifier(schema)}.${wrapIdentifier('resource')}`
		await client.query(`CREATE TABLE ${resource} (id integer PRIMARY KEY)`)
		await client.query(`INSERT INTO ${resource} (id) VALUES (1), (2)`)
		const lockedFirstRow = createBarrier(2)

		const updateInOrder = async (first: number, second: number): Promise<void> => {
			await client.transaction(async transaction => {
				await transaction.query(`UPDATE ${resource} SET id = id WHERE id = ?`, [first])
				await lockedFirstRow()
				await transaction.query(`UPDATE ${resource} SET id = id WHERE id = ?`, [second])
			})
		}

		const results = await Promise.allSettled([
			updateInOrder(1, 2),
			updateInOrder(2, 1),
		])
		const failures = results.filter(result => result.status === 'rejected')
		expect(failures).toHaveLength(1)
		const failure = failures[0]
		if (failure === undefined || failure.status !== 'rejected') {
			throw new Error('Expected one rejected transaction')
		}
		expect(failure.reason).toBeInstanceOf(SerializationFailureError)
		expect(failure.reason.code).toBe('40P01')
	})
})

runDatabaseTest('SERIALIZABLE prevents a real PostgreSQL write-skew', async () => {
	await withSchema(async (client, schema) => {
		const doctor = `${wrapIdentifier(schema)}.${wrapIdentifier('doctor')}`
		await client.query(`CREATE TABLE ${doctor} (id integer PRIMARY KEY, on_call boolean NOT NULL)`)
		await client.query(`INSERT INTO ${doctor} (id, on_call) VALUES (1, true), (2, true)`)
		const readSharedState = createBarrier(2)

		const leaveOnCall = async (id: number): Promise<void> => {
			await client.transaction(async transaction => {
				await transaction.connection.query(Connection.SERIALIZABLE)
				const result = await transaction.query<{ count: string }>(`SELECT count(*) AS count FROM ${doctor} WHERE on_call`)
				expect(result.rows[0]?.count).toBe('2')
				await readSharedState()
				await transaction.query(`UPDATE ${doctor} SET on_call = false WHERE id = ?`, [id])
			})
		}

		const results = await Promise.allSettled([
			leaveOnCall(1),
			leaveOnCall(2),
		])
		const failures = results.filter(result => result.status === 'rejected')
		expect(failures).toHaveLength(1)
		const failure = failures[0]
		if (failure === undefined || failure.status !== 'rejected') {
			throw new Error('Expected one rejected transaction')
		}
		expect(failure.reason).toBeInstanceOf(SerializationFailureError)
		expect(failure.reason.code).toBe('40001')

		const remaining = await client.query<{ count: string }>(`SELECT count(*) AS count FROM ${doctor} WHERE on_call`)
		expect(remaining.rows[0]?.count).toBe('1')
	})
})
