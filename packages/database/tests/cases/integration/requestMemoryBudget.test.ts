import { expect, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { Connection, RequestMemoryBudget, RequestMemoryBudgetExceededError, retryTransaction } from '../../../src/index.js'

const databaseUrl = process.env.MEMORY_TEST_DATABASE_URL
const databaseTest = test.skipIf(!databaseUrl)

function createConnection(queryTimeoutMs?: number) {
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
		queryTimeoutMs,
		pool: { maxConnections: 3 },
	}, error => {
		throw error
	})
}

databaseTest('budget interrupts accumulation and the pool serves the next request', async () => {
	const connection = createConnection()
	try {
		const base = connection.createClient('public', {})
		const budget = new RequestMemoryBudget({ warnBytes: 128 * 1024, maxBytes: 256 * 1024 })
		const db = base.withMemoryBudget(budget)
		await expect(db.query('SELECT repeat(?, 1024) AS body FROM generate_series(1, 100000)', ['x']))
			.rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		expect(budget.snapshot().databaseRows).toBeLessThan(1000)
		expect((await base.query('SELECT 42 AS value')).rows).toEqual([{ value: 42 }])
	} finally {
		await connection.end()
	}
})

databaseTest('budget aborts a sibling query still waiting for its first row', async () => {
	const connection = createConnection()
	try {
		const budget = new RequestMemoryBudget({ warnBytes: 128 * 1024, maxBytes: 256 * 1024 })
		const db = connection.createClient('public', {}).withMemoryBudget(budget)
		const start = Date.now()
		const results = await Promise.allSettled([
			db.query('SELECT pg_sleep(3)'),
			db.query('SELECT repeat(?, 1024) AS body FROM generate_series(1, 100000)', ['x']),
		])
		for (const result of results) {
			expect(result.status).toBe('rejected')
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(RequestMemoryBudgetExceededError)
			}
		}
		expect(Date.now() - start).toBeLessThan(2500)
	} finally {
		await connection.end()
	}
})

databaseTest('row observation preserves pg query timeouts and row accumulation', async () => {
	const connection = createConnection(100)
	try {
		const budget = new RequestMemoryBudget({ warnBytes: 512 * 1024, maxBytes: 1024 * 1024 })
		const db = connection.createClient('public', {}).withMemoryBudget(budget)
		expect((await db.query('SELECT i FROM generate_series(1, 10) i')).rows).toHaveLength(10)
		await expect(db.query('SELECT pg_sleep(3)')).rejects.toThrow('Query read timeout')
		expect((await db.query('SELECT 42 AS value')).rows).toEqual([{ value: 42 }])
	} finally {
		await connection.end()
	}
})

databaseTest.each([false, true])('reads exceeding the budget roll back writes without retrying (savepoint: %s)', async savepoint => {
	const connection = createConnection()
	const base = connection.createClient('public', {})
	const table = `memory_budget_${randomUUID().replaceAll('-', '')}`
	try {
		await base.query(`CREATE TABLE "${table}" (value integer)`)
		const budget = new RequestMemoryBudget({ warnBytes: 128 * 1024, maxBytes: 256 * 1024 })
		const db = base.withMemoryBudget(budget)
		let attempts = 0
		await expect(retryTransaction(async () => {
			attempts++
			await db.transaction(async transaction => {
				await transaction.query(`INSERT INTO "${table}" VALUES (42)`)
				const sql = "SELECT repeat('x', 1024) AS body FROM generate_series(1, 100000)"
				if (savepoint) {
					await transaction.transaction(inner => inner.query(sql))
				} else {
					await transaction.query(sql)
				}
			})
		}, () => {})).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		expect(attempts).toBe(1)
		expect((await base.query(`SELECT * FROM "${table}"`)).rows).toEqual([])
		await base.withMemoryBudget(new RequestMemoryBudget({ warnBytes: 512, maxBytes: 256 * 1024 })).transaction(async transaction => {
			await transaction.query(`INSERT INTO "${table}" VALUES (43)`)
			await transaction.query('SELECT i FROM generate_series(1, 10) i')
		})
		expect((await base.query(`SELECT * FROM "${table}"`)).rows).toEqual([{ value: 43 }])
	} finally {
		try {
			await base.query(`DROP TABLE IF EXISTS "${table}"`)
		} finally {
			await connection.end()
		}
	}
})
