import { EventManager } from '../../../src'
import { assert, test } from 'vitest'
import { createConnectionMockAlt } from './createConnectionMockAlt'

test('event manager: connection and client', async () => {
	const [connection, end] = createConnectionMockAlt([
		{ sql: 'SELECT 1' },
		{ sql: 'SELECT 2' },
	])
	const events: { source: string; sql: string }[] = []
	const client = connection.createClient('public', {})

	connection.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'connection' }))
	client.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'client' }))
	await client.query('SELECT 1')
	await connection.query('SELECT 2')
	assert.deepStrictEqual(events, [
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'SELECT 2', source: 'connection' },
	])
	end()
})


test('event manager: connection and client with transaction', async () => {
	const [connection, end] = createConnectionMockAlt([
		{ sql: 'BEGIN' },
		{ sql: 'SELECT 1' },
		{ sql: 'COMMIT' },
		{ sql: 'SELECT 2' },
		{ sql: 'SELECT 3' },
	])
	const events: { source: string; sql: string }[] = []
	const client = connection.createClient('public', {})

	connection.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'connection' }))
	client.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'client' }))
	await client.transaction(async trx => {
		trx.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'transaction' }))
		await trx.query('SELECT 1')

	})
	await client.query('SELECT 2')
	await connection.query('SELECT 3')
	assert.deepStrictEqual(events, [
		{ sql: 'BEGIN', source: 'client' },
		{ sql: 'BEGIN', source: 'connection' },
		{ sql: 'SELECT 1', source: 'transaction' },
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'COMMIT', source: 'client' },
		{ sql: 'COMMIT', source: 'connection' },
		{ sql: 'SELECT 2', source: 'client' },
		{ sql: 'SELECT 2', source: 'connection' },
		{ sql: 'SELECT 3', source: 'connection' },
	])
	end()
})


test('event manager: connection and client with scopes', async () => {
	const [connection, end] = createConnectionMockAlt([
		{ sql: 'SELECT 1' },
		{ sql: 'SELECT 2' },
		{ sql: 'SELECT 3' },
	])
	const events: { source: string; sql: string }[] = []
	const client = connection.createClient('public', {})

	connection.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'connection' }))
	client.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'client' }))
	await client.scope(async conn => {
		conn.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'scoped' }))
		await conn.query('SELECT 1')

	})
	await client.query('SELECT 2')
	await connection.query('SELECT 3')
	assert.deepStrictEqual(events, [
		{ sql: 'SELECT 1', source: 'scoped' },
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'SELECT 2', source: 'client' },
		{ sql: 'SELECT 2', source: 'connection' },
		{ sql: 'SELECT 3', source: 'connection' },
	])
	end()
})


test('event manager: connection and client with transaction and savepoint', async () => {
	const [connection, end] = createConnectionMockAlt([
		{ sql: 'BEGIN' },
		{ sql: 'SELECT 1' },
		{ sql: 'SAVEPOINT "savepoint_1"' },
		{ sql: 'SELECT 2' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_1"' },
		{ sql: 'COMMIT' },
		{ sql: 'SELECT 3' },
		{ sql: 'SELECT 4' },
	])
	const events: { source: string; sql: string }[] = []
	const client = connection.createClient('public', {})

	connection.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'connection' }))
	client.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'client' }))
	await client.transaction(async trx => {
		trx.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'transaction' }))
		await trx.query('SELECT 1')
		await trx.transaction(async savepoint => {
			savepoint.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'savepoint' }))
			await savepoint.query('SELECT 2')

		})

	})
	await client.query('SELECT 3')
	await connection.query('SELECT 4')
	assert.deepStrictEqual(events, [
		{ sql: 'BEGIN', source: 'client' },
		{ sql: 'BEGIN', source: 'connection' },
		{ sql: 'SELECT 1', source: 'transaction' },
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'SAVEPOINT "savepoint_1"', source: 'transaction' },
		{ sql: 'SAVEPOINT "savepoint_1"', source: 'client' },
		{ sql: 'SAVEPOINT "savepoint_1"', source: 'connection' },
		{ sql: 'SELECT 2', source: 'savepoint' },
		{ sql: 'SELECT 2', source: 'transaction' },
		{ sql: 'SELECT 2', source: 'client' },
		{ sql: 'SELECT 2', source: 'connection' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_1"', source: 'transaction' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_1"', source: 'client' },
		{ sql: 'RELEASE SAVEPOINT "savepoint_1"', source: 'connection' },
		{ sql: 'COMMIT', source: 'client' },
		{ sql: 'COMMIT', source: 'connection' },
		{ sql: 'SELECT 3', source: 'client' },
		{ sql: 'SELECT 3', source: 'connection' },
		{ sql: 'SELECT 4', source: 'connection' },
	])
	end()
})
