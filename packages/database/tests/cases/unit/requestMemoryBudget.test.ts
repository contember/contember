import { expect, test } from 'bun:test'
import { Client, Connection, RequestMemoryBudget, RequestMemoryBudgetExceededError } from '../../../src/index.js'

test('thresholds are exceeded only above their configured values', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 100, maxBytes: 200 })
	budget.addHydrationBytes(50)
	expect(budget.snapshot().warningThresholdExceeded).toBe(false)
	budget.addHydrationBytes(1)
	expect(budget.snapshot().warningThresholdExceeded).toBe(true)
	budget.addHydrationBytes(49)
	expect(budget.snapshot().maxBytesExceeded).toBe(false)
	expect(() => budget.addHydrationBytes(1)).toThrow(RequestMemoryBudgetExceededError)
	expect(budget.snapshot().maxBytesExceeded).toBe(true)
})

test('budget rejects invalid or reversed thresholds', () => {
	for (const value of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
		expect(() => new RequestMemoryBudget({ warnBytes: value, maxBytes: 1024 })).toThrow()
		expect(() => new RequestMemoryBudget({ warnBytes: 1, maxBytes: value })).toThrow()
	}
	expect(() => new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 512 })).toThrow()
	expect(() => new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 1024 })).not.toThrow()
})

test('warning threshold records oversize rows without interrupting execution', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 32768 })
	budget.addDatabaseRow({ text: 'x'.repeat(2048) })
	expect(budget.snapshot().warningThresholdExceeded).toBe(true)
	expect(budget.snapshot().maxBytesExceeded).toBe(false)
	expect(budget.signal.aborted).toBe(false)
	expect(() => budget.check()).not.toThrow()
})

test('one large value aborts the shared budget and all subsequent work', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	let aborted = false
	budget.signal.addEventListener('abort', () => aborted = true)
	expect(() => budget.addDatabaseRow({ text: 'x'.repeat(2048) })).toThrow(RequestMemoryBudgetExceededError)
	expect(aborted).toBe(true)
	expect(() => budget.addHydrationBytes(1)).toThrow(RequestMemoryBudgetExceededError)
	expect(() => budget.prepareResponse(null)).toThrow(RequestMemoryBudgetExceededError)
})

test('a wide nested JSON value is included in the request estimate', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 100_000 })
	expect(() => budget.addDatabaseRow({ json: Array.from({ length: 1000 }, () => ({ body: 'x'.repeat(100) })) }))
		.toThrow(RequestMemoryBudgetExceededError)
})

test('response expansion is checked before serialization', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 4096 })
	budget.addDatabaseRow({ id: 1 })
	expect(() => budget.prepareResponse({ expanded: 'x'.repeat(4096) })).toThrow(RequestMemoryBudgetExceededError)
})

test('large JSON property names contribute to the budget', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 4096 })
	expect(() => budget.addDatabaseRow({ json: { ['k'.repeat(4096)]: null } })).toThrow(RequestMemoryBudgetExceededError)
})

test('request budget does not leak to another client on the same pool', async () => {
	const connection = Connection.create({ host: 'unused', database: 'unused', user: 'unused', password: 'unused', port: 5432 }, () => {})
	const base = new Client(connection, 'public', {})
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	const scoped = base.withMemoryBudget(budget)
	expect(scoped.eventManager.memoryBudget).toBe(budget)
	expect(scoped.forSchema('other').eventManager.memoryBudget).toBe(budget)
	expect(base.eventManager.memoryBudget).toBeUndefined()
	expect(connection.eventManager.memoryBudget).toBeUndefined()
	expect(() => budget.addDatabaseRow({ text: 'x'.repeat(1024) })).toThrow(RequestMemoryBudgetExceededError)
	await expect(scoped.query('SELECT 1')).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
	expect(connection.getPoolStatus().stats.connection_started_count).toBe(0)
})
