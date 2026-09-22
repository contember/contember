import { expect, test } from 'bun:test'
import { Connection, RequestMemoryBudget, RequestMemoryBudgetExceededError } from '@contember/database'
import { TestTransactionService } from '../../../src/testing/TestTransactions.js'

const databaseUrl = process.env.MEMORY_TEST_DATABASE_URL
const databaseTest = test.skipIf(!databaseUrl)

function createConnection() {
	if (!databaseUrl) {
		throw new Error('Set MEMORY_TEST_DATABASE_URL to a local PostgreSQL database')
	}
	const url = new URL(databaseUrl)
	return Connection.create({
		host: url.hostname,
		port: Number(url.port || 5432),
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.slice(1),
		pool: { maxConnections: 1, acquireTimeoutMs: 1000 },
	}, error => {
		throw error
	})
}

databaseTest('hydration budget exhaustion rolls back only the request savepoint in a test session', async () => {
	const connection = createConnection()
	const service = new TestTransactionService(true)
	const token = service.begin()
	try {
		const first = await service.resolveContentClient(token, 'test', connection, 'public', {})
		if (!first) {
			throw new Error('Expected a test session client')
		}
		await first.query('CREATE TEMP TABLE memory_budget_test (value integer)')
		await first.query('INSERT INTO memory_budget_test VALUES (1)')
		const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
		await expect(
			first.withMemoryBudget(budget).transaction(async transaction => {
				await transaction.query('INSERT INTO memory_budget_test VALUES (2)')
				budget.addHydrationBytes(1024)
			}),
		).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		await expect(first.withMemoryBudget(budget).query('SELECT 1')).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		expect(service.hasSession(token)).toBe(true)
		const second = await service.resolveContentClient(token, 'test', connection, 'public', {})
		if (!second) {
			throw new Error('Expected the test session to survive a savepoint rollback')
		}
		expect(second.eventManager.memoryBudget).toBeUndefined()
		const nextBudget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 32768 })
		expect((await second.withMemoryBudget(nextBudget).query('SELECT * FROM memory_budget_test')).rows).toEqual([{ value: 1 }])
	} finally {
		await service.rollback(token)
		await connection.end()
	}
})

databaseTest('a budget-closed test connection invalidates its session and releases the pool slot', async () => {
	const connection = createConnection()
	const service = new TestTransactionService(true)
	const token = service.begin()
	try {
		const first = await service.resolveContentClient(token, 'test', connection, 'public', {})
		if (!first) {
			throw new Error('Expected a test session client')
		}
		const { ended } = await first.scope(client => ({
			ended: new Promise<void>(resolve => {
				const removeListener = client.connection.on('end', () => {
					removeListener()
					resolve()
				})
			}),
		}))
		const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
		await expect(first.withMemoryBudget(budget).query("SELECT repeat('x', 2048)"))
			.rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		await ended
		expect(service.hasSession(token)).toBe(false)
		expect(await service.resolveContentClient(token, 'test', connection, 'public', {})).toBeUndefined()
		const base = connection.createClient('public', {})
		expect((await base.query('SELECT 42 AS value')).rows).toEqual([{ value: 42 }])
		expect(connection.getPoolStatus().active).toBe(0)
	} finally {
		await service.rollback(token)
		await connection.end()
	}
})
