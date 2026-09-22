import { expect, test } from 'bun:test'
import { Client, Connection, RequestMemoryBudget, RequestMemoryBudgetExceededError } from '../../../src/index.js'
import { createConnectionMockAlt, createConnectionMockAltWithPool } from './createConnectionMockAlt.js'

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
	expect(budget.exceeded).toBe(false)
	expect(() => budget.check()).not.toThrow()
})

test('one large value aborts the shared budget and all subsequent work', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	const reported: Error[] = []
	const unsubscribed: Error[] = []
	budget.onExceeded(failure => reported.push(failure))
	budget.onExceeded(failure => unsubscribed.push(failure))()
	expect(() => budget.addDatabaseRow({ text: 'x'.repeat(2048) })).toThrow(RequestMemoryBudgetExceededError)
	expect(reported).toEqual([expect.any(RequestMemoryBudgetExceededError)])
	expect(unsubscribed).toEqual([])
	expect(budget.exceeded).toBe(true)
	// A late subscriber is called right away.
	budget.onExceeded(failure => reported.push(failure))
	expect(reported).toHaveLength(2)
	expect(reported[1]).toBe(reported[0])
	expect(() => budget.addHydrationBytes(1)).toThrow(RequestMemoryBudgetExceededError)
	expect(() => budget.check()).toThrow(RequestMemoryBudgetExceededError)
})

test('a wide nested JSON value is included in the request estimate', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 100_000 })
	expect(() => budget.addDatabaseRow({ json: Array.from({ length: 1000 }, () => ({ body: 'x'.repeat(100) })) }))
		.toThrow(RequestMemoryBudgetExceededError)
})

test.each([63, 64, 65, 10_000])('nested JSON at depth %i preserves string accounting without overflowing the call stack', depth => {
	type Node = { child: Node | null; text: string }
	const createValue = (specialAt: number): Node | null => {
		let value: Node | null = null
		for (let i = 0; i < depth; i++) {
			value = { child: value, text: i === specialAt ? '漢\u0001' : 'plain' }
		}
		return value
	}
	const options = { warnBytes: 1024, maxBytes: Number.MAX_SAFE_INTEGER }
	const deep = new RequestMemoryBudget(options)
	const shallow = new RequestMemoryBudget(options)
	deep.addDatabaseRow({ value: createValue(0) })
	shallow.addDatabaseRow({ value: createValue(depth - 1) })
	expect(deep.snapshot()).toEqual(shallow.snapshot())
	expect(deep.snapshot().estimatedPeakBytes).toBeGreaterThan(depth * 32)
	const limited = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 2048 })
	expect(() => limited.addDatabaseRow({ value: createValue(0) })).toThrow(RequestMemoryBudgetExceededError)
})

test.each([31, 32, 33, 5000])('alternating arrays and objects preserve accounting across %i levels', levels => {
	type Node = { children: Node[]; text: string }
	const createValue = (specialAt: number): Node[] => {
		let children: Node[] = []
		for (let i = 0; i < levels; i++) {
			children = [{ children, text: i === specialAt ? '漢\u0001' : 'plain' }]
		}
		return children
	}
	const options = { warnBytes: 1024, maxBytes: Number.MAX_SAFE_INTEGER }
	const deepValue = createValue(0)
	const shallowValue = createValue(levels - 1)
	const deep = new RequestMemoryBudget(options)
	const shallow = new RequestMemoryBudget(options)
	deep.addDatabaseRow({ payload: deepValue })
	shallow.addDatabaseRow({ payload: shallowValue })
	expect(deep.snapshot()).toEqual(shallow.snapshot())
	expect(deep.snapshot().estimatedPeakBytes).toBeGreaterThan(levels * 32)
})

test('large JSON property names contribute to the budget', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 4096 })
	expect(() => budget.addDatabaseRow({ json: { ['k'.repeat(4096)]: null } })).toThrow(RequestMemoryBudgetExceededError)
})

test.each(['é', '漢'])('ASCII database text fits a budget that rejects non-ASCII text (%s)', character => {
	const options = { warnBytes: 1024, maxBytes: 25_000 }
	const narrow = new RequestMemoryBudget(options)
	expect(() => narrow.addDatabaseRow({ body: 'x'.repeat(4096) })).not.toThrow()
	const wide = new RequestMemoryBudget(options)
	expect(() => wide.addDatabaseRow({ body: character.repeat(4096) })).toThrow(RequestMemoryBudgetExceededError)
})

test('a wide value reserves serialization promotion for the other strings in the request', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 14_000 })
	for (let i = 0; i < 8; i++) {
		budget.addDatabaseRow({ body: 'x'.repeat(512) })
	}
	expect(() => budget.addDatabaseRow({ body: '漢' })).toThrow(RequestMemoryBudgetExceededError)
})

test('a single wide character inside a large string widens the whole string', () => {
	const options = { warnBytes: 1024, maxBytes: 1_000_000 }
	const narrow = new RequestMemoryBudget(options)
	narrow.addDatabaseRow({ body: 'x'.repeat(8192) })
	const wide = new RequestMemoryBudget(options)
	wide.addDatabaseRow({ body: 'x'.repeat(4096) + '漢' + 'x'.repeat(4095) })
	expect(wide.snapshot().databaseBytes - narrow.snapshot().databaseBytes).toBe(8192)
})

test('astral and BMP text of equal length are estimated identically', () => {
	const options = { warnBytes: 1024, maxBytes: 20_000 }
	const bmp = new RequestMemoryBudget(options)
	bmp.addDatabaseRow({ body: '漢漢'.repeat(1024) })
	const astral = new RequestMemoryBudget(options)
	astral.addDatabaseRow({ body: '😀'.repeat(1024) })
	expect(astral.snapshot().estimatedPeakBytes).toBe(bmp.snapshot().estimatedPeakBytes)
})

test('Latin-1 text conservatively reserves two-byte serialization', () => {
	const options = { warnBytes: 1024, maxBytes: 100_000 }
	const latin1 = new RequestMemoryBudget(options)
	latin1.addDatabaseRow({ body: 'x'.repeat(4096), suffix: 'é' })
	const wide = new RequestMemoryBudget(options)
	wide.addDatabaseRow({ body: 'x'.repeat(4096), suffix: '漢' })
	expect(wide.snapshot().estimatedPeakBytes).toBe(latin1.snapshot().estimatedPeakBytes)
})

test('string accounting does not retain request data in RegExp.input', () => {
	const budget = new RequestMemoryBudget({ warnBytes: 1024, maxBytes: 100_000 })
	const response = { body: '漢'.repeat(4096), escaped: '\u0001'.repeat(1024) }
	const sentinel = /memory-budget-sentinel/
	sentinel.test('memory-budget-sentinel')
	budget.addDatabaseRow(response)
	budget.addDatabaseRow(response)
	const lastRegexpInput = RegExp.input
	expect(lastRegexpInput).toBe('memory-budget-sentinel')
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

test('a client bound without charging refuses queries once the budget is exhausted but accounts no rows', async () => {
	const [connection, end] = createConnectionMockAlt([{ sql: 'SELECT 1', result: { rows: [{ value: 1 }] } }])
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	const bound = new Client(connection, 'public', {}).withMemoryBudget(budget, { chargeRows: false })
	expect(bound.eventManager.chargesMemoryBudget).toBe(false)
	expect(bound.forSchema('other').eventManager.chargesMemoryBudget).toBe(false)
	expect(bound.withMemoryBudget(budget).eventManager.chargesMemoryBudget).toBe(true)

	await bound.query('SELECT 1')
	expect(budget.snapshot().databaseRows).toBe(0)
	expect(() => budget.addHydrationBytes(2048)).toThrow(RequestMemoryBudgetExceededError)
	await expect(bound.query('SELECT 2')).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
	await expect(bound.transaction(() => Promise.resolve())).rejects.toBeInstanceOf(RequestMemoryBudgetExceededError)
	end()
})

test('a budget exhausted while waiting for the pool releases the acquired connection instead of disposing it', async () => {
	const [connection, end] = createConnectionMockAltWithPool({ maxConnections: 1 }, [{ sql: 'SELECT 1', timeout: 5 }, { sql: 'SELECT 2' }])
	const budget = new RequestMemoryBudget({ warnBytes: 512, maxBytes: 1024 })
	const base = new Client(connection, 'public', {})
	const bound = base.withMemoryBudget(budget)

	const results = await Promise.allSettled([
		base.scope(async client => {
			await client.query('SELECT 1')
			expect(() => budget.addHydrationBytes(2048)).toThrow(RequestMemoryBudgetExceededError)
		}),
		bound.query('SELECT 3'),
	])
	expect(results[0].status).toBe('fulfilled')
	expect(results[1].status).toBe('rejected')
	expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(RequestMemoryBudgetExceededError)
	// The only pooled connection survived the refused scope.
	await base.query('SELECT 2')
	expect(connection.getPoolStatus().stats.connection_disposed_manual_count).toBe(0)
	end()
})
