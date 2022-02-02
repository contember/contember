import { EventManager } from '../../../src'
import { createConnectionMock } from '@contember/database-tester'
import { test } from 'uvu'
import assert from 'uvu/assert'

const simpleQuery = (sql: string) => ({
	sql,
	parameters: [],
	response: { rows: [] },
})

test('event manager: connection and client', async () => {
	const connection = createConnectionMock([
		simpleQuery('SELECT 1'),
		simpleQuery('SELECT 2'),
	])
	const events: { source: string; sql: string }[] = []
	const client = connection.createClient('public', {})

	connection.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'connection' }))
	client.eventManager.on(EventManager.Event.queryStart, ({ sql }) => events.push({ sql, source: 'client' }))
	await client.query('SELECT 1')
	await connection.query('SELECT 2')
	assert.equal(events, [
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'SELECT 2', source: 'connection' },
	])
})


test('event manager: connection and client with transaction', async () => {
	const connection = createConnectionMock([
		simpleQuery('BEGIN;'),
		simpleQuery('SELECT 1'),
		simpleQuery('COMMIT;'),
		simpleQuery('SELECT 2'),
		simpleQuery('SELECT 3'),
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
	assert.equal(events, [
		{ sql: 'BEGIN;', source: 'connection' },
		{ sql: 'SELECT 1', source: 'transaction' },
		{ sql: 'SELECT 1', source: 'client' },
		{ sql: 'SELECT 1', source: 'connection' },
		{ sql: 'COMMIT;', source: 'connection' },
		{ sql: 'SELECT 2', source: 'client' },
		{ sql: 'SELECT 2', source: 'connection' },
		{ sql: 'SELECT 3', source: 'connection' },
	])
})
test.run()
