import { describe, expect, test } from 'bun:test'
import { Client, Connection, EventManager } from '@contember/database'
import { Actions } from '@contember/schema'
import { EventsRepository } from '../../../src/dispatch/EventsRepository'
import { EventRow } from '../../../src/model/types'
import { testUuid } from '../../src/uuid'

/**
 * Answers statements from a script, then with an empty result, so what is under test is the
 * repository's own bookkeeping rather than any SQL. Every statement is recorded in `queries`.
 */
const createStubClient = (responses: Connection.Result[] = [], queries: { sql: string; parameters: readonly any[] }[] = []): Client => {
	const remaining = [...responses]
	const eventManager = new EventManager()
	const query = async <Row extends Record<string, any>>(sql: string, parameters: readonly any[] = []): Promise<Connection.Result<Row>> => {
		queries.push({ sql, parameters })
		const next = remaining.shift() ?? { rowCount: 0, rows: [] }
		return { rowCount: next.rowCount, rows: next.rows as Row[] }
	}
	const transaction: Connection.TransactionLike = {
		eventManager,
		isClosed: false,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
		on: () => () => {},
		rollback: async () => {},
		commit: async () => {},
	}
	const connection: Connection.ConnectionLike = {
		eventManager,
		query,
		scope: cb => Promise.resolve(cb(transaction)),
		transaction: cb => Promise.resolve(cb(transaction)),
	}
	return new Client(connection, 'system', {})
}

const now = new Date('2024-06-20T12:00:00Z')

const eventRow: EventRow = {
	created_at: now,
	id: testUuid(1),
	trigger: 'test',
	target: 'test_target',
	last_state_change: now,
	log: [],
	num_retries: 0,
	resolved_at: null,
	transaction_id: testUuid(2),
	stage_id: testUuid(3),
	visible_at: now,
	payload: { operation: 'delete', trigger: 'test', entity: 'Article', id: testUuid(5) },
	priority: 1,
	schema_id: 1,
	state: 'processing',
}

describe('fetchBatch', () => {
	test("fills a batch only with events of the primary event's target", async () => {
		const queries: { sql: string; parameters: readonly any[] }[] = []
		const target: Actions.WebhookTarget = {
			name: 'test_target',
			type: 'webhook',
			url: 'http://localhost',
			maxAttempts: 3,
			batchSize: 3,
		}
		const client = createStubClient([
			{ rowCount: 1, rows: [eventRow] },
			{ rowCount: 0, rows: [] },
		], queries)

		const result = await new EventsRepository().fetchBatch({ triggers: {}, targets: { test_target: target } }, client)

		expect(result).toEqual({ ok: true, events: [eventRow], target })
		expect(queries).toHaveLength(2)
		// the rest of the batch goes to the same webhook — it must not pick up events of other targets
		expect(queries[1].sql).toContain('"target" = ?')
		expect(queries[1].parameters).toContain('test_target')
	})
})
