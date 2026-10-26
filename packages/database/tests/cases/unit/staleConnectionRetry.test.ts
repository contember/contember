import { expect, it } from 'bun:test'
import { createConnectionMockAltWithOptions } from './createConnectionMockAlt.js'
import { Connection } from '../../../src/index.js'

const terminated = () => new Error('Connection terminated unexpectedly')
const adminShutdown = () => Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' })
const retrying = { connection: { retryStaleConnection: true } }

const warmUp = async (connection: Connection) => {
	await connection.query('SELECT 1')
}

it('runs the scope again when a pooled connection was lost before answering', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1' }, { sql: 'BEGIN', error: terminated(), lost: true }],
		[{ sql: 'BEGIN' }, { sql: 'SELECT 2', result: { rows: [{ ok: true }] } }, { sql: 'COMMIT', result: { command: 'COMMIT' } }],
	)
	await warmUp(connection)
	const rows = await connection.transaction(async trx => (await trx.query('SELECT 2')).rows)
	expect(rows).toStrictEqual([{ ok: true }])
	end()
})

it('runs the scope again when the server shut a pooled connection down', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1' }, { sql: 'SELECT 2', error: adminShutdown() }],
		[{ sql: 'SELECT 2', result: { rows: [] } }],
	)
	await warmUp(connection)
	await connection.query('SELECT 2')
	end()
})

it('keeps going through stale idle connections until a working one', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1', timeout: 5 }, { sql: 'SELECT 2', error: terminated(), lost: true }],
		[{ sql: 'SELECT 1', timeout: 5 }, { sql: 'SELECT 2', error: adminShutdown() }],
		[{ sql: 'SELECT 2', result: { rows: [] } }],
	)
	await Promise.all([warmUp(connection), warmUp(connection)])
	await connection.query('SELECT 2')
	end()
})

it('does not retry without the option', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		{},
		[{ sql: 'SELECT 1' }, { sql: 'SELECT 2', error: terminated(), lost: true }],
	)
	await warmUp(connection)
	await expect(connection.query('SELECT 2')).rejects.toThrow('Connection terminated unexpectedly')
	end()
})

it('does not retry a new connection', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1', error: terminated(), lost: true }],
	)
	await expect(connection.query('SELECT 1')).rejects.toThrow('Connection terminated unexpectedly')
	end()
})

it('does not retry once the connection answered a query', async () => {
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1' }, { sql: 'BEGIN' }, { sql: 'SELECT 2', error: terminated(), lost: true }, { sql: 'ROLLBACK' }],
	)
	await warmUp(connection)
	await expect(connection.transaction(trx => trx.query('SELECT 2'))).rejects.toThrow('Connection terminated unexpectedly')
	end()
})

it('does not retry a query error on a live connection', async () => {
	const syntaxError = Object.assign(new Error('syntax error'), { code: '42601' })
	const [connection, end] = createConnectionMockAltWithOptions(
		retrying,
		[{ sql: 'SELECT 1' }, { sql: 'SELECT 2', error: syntaxError }],
	)
	await warmUp(connection)
	await expect(connection.query('SELECT 2')).rejects.toThrow('syntax error')
	end()
})
