import { expect, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { Connection, EventManager, RequestMemoryBudget, RequestMemoryBudgetExceededError, retryTransaction } from '../../../src/index.js'

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

databaseTest('hydration budget exhaustion rolls back a transaction without closing its enclosing scope', async () => {
	const connection = createConnection()
	try {
		await connection.createClient('public', {}).scope(async base => {
			await base.query('CREATE TEMP TABLE memory_budget_hydration (value integer)')
			const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
			await expect(
				base.withMemoryBudget(budget).transaction(async transaction => {
					await transaction.query('INSERT INTO memory_budget_hydration VALUES (42)')
					budget.addHydrationBytes(1024)
				}),
			).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
			expect((await base.query('SELECT * FROM memory_budget_hydration')).rows).toEqual([])
		})
	} finally {
		await connection.end()
	}
})

databaseTest('budgets stay request-local and cannot cancel a connection reused by another request', async () => {
	const connection = createConnection()
	try {
		const base = connection.createClient('public', {})
		const failedBudget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
		const healthyBudget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 32768 })
		const [, healthyPid] = await Promise.all([
			expect(base.withMemoryBudget(failedBudget).query("SELECT repeat('x', 2048)"))
				.rejects.toBeInstanceOf(RequestMemoryBudgetExceededError),
			base.withMemoryBudget(healthyBudget).scope(async scoped => {
				expect(scoped.eventManager.memoryBudget).toBe(healthyBudget)
				expect(scoped.forSchema('public').eventManager.memoryBudget).toBe(healthyBudget)
				await scoped.transaction(async transaction => {
					expect(transaction.eventManager.memoryBudget).toBe(healthyBudget)
					await transaction.transaction(async savepoint => {
						expect(savepoint.eventManager.memoryBudget).toBe(healthyBudget)
						expect((await savepoint.query('SELECT 42 AS value')).rows).toEqual([{ value: 42 }])
					})
				})
				return (await scoped.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0].pid
			}),
		])
		expect(healthyBudget.exceeded).toBe(false)
		expect(base.eventManager.memoryBudget).toBeUndefined()
		expect(connection.eventManager.memoryBudget).toBeUndefined()
		await base.scope(async reused => {
			expect((await reused.query('SELECT pg_backend_pid() AS pid')).rows).toEqual([{ pid: healthyPid }])
			expect(() => healthyBudget.addHydrationBytes(32768)).toThrow(RequestMemoryBudgetExceededError)
			expect((await reused.query('SELECT 42 AS value')).rows).toEqual([{ value: 42 }])
		})
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

databaseTest.each([false, true])('a budget-terminated transaction reports one budget error and no SQL error (savepoint: %s)', async savepoint => {
	const connection = createConnection()
	try {
		const queryErrors: Error[] = []
		connection.eventManager.on(EventManager.Event.queryError, (query, error) => {
			queryErrors.push(error)
		})
		const budget = new RequestMemoryBudget({ warnBytes: 128 * 1024, maxBytes: 256 * 1024 })
		const db = connection.createClient('public', {}).withMemoryBudget(budget)
		const sql = "SELECT repeat('x', 1024) AS body FROM generate_series(1, 100000)"
		await expect(db.transaction(async transaction => {
			if (savepoint) {
				await transaction.transaction(inner => inner.query(sql))
			} else {
				await transaction.query(sql)
			}
		})).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		expect(queryErrors).toHaveLength(1)
		expect(queryErrors[0]).toBeInstanceOf(RequestMemoryBudgetExceededError)
	} finally {
		await connection.end()
	}
})

databaseTest('queries queued behind the one that exhausted the budget report the budget, not the terminated connection', async () => {
	const connection = createConnection()
	try {
		const budget = new RequestMemoryBudget({ warnBytes: 128 * 1024, maxBytes: 256 * 1024 })
		const bound = connection.createClient('public', {}).withMemoryBudget(budget, { chargeRows: false })
		let results: PromiseSettledResult<unknown>[] = []
		// The commit of the terminated connection fails with the budget error as well.
		await expect(bound.transaction(async transaction => {
			const charged = transaction.withMemoryBudget(budget, { chargeRows: true })
			results = await Promise.allSettled([
				charged.query("SELECT repeat('x', 1024) AS body FROM generate_series(1, 100000)"),
				transaction.query('SELECT 1'),
				charged.query('SELECT 2'),
			])
		})).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
		expect(results).toHaveLength(3)
		for (const result of results) {
			expect(result.status).toBe('rejected')
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(RequestMemoryBudgetExceededError)
			}
		}
	} finally {
		await connection.end()
	}
})

databaseTest('a failed rollback is reported when the budget left the connection alive', async () => {
	const connection = createConnection()
	try {
		const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
		const db = connection.createClient('public', {}).withMemoryBudget(budget)
		await expect(db.transaction(async transaction => {
			await transaction.transaction(async inner => {
				// Releasing the savepoint behind its back makes the following ROLLBACK TO SAVEPOINT fail.
				await inner.query('RELEASE SAVEPOINT "savepoint_1"')
				budget.addHydrationBytes(1024)
			})
		})).rejects.toThrow('savepoint "savepoint_1" does not exist')
	} finally {
		await connection.end()
	}
})
