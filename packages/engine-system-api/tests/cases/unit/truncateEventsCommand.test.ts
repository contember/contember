import { expect, test } from 'bun:test'
import { TruncateEventsCommand } from '../../../src/model/index.js'
import { testUuid } from '../../src/uuid.js'

const createMockDb = () => {
	const queries: { sql: string; params: any[] }[] = []
	return {
		queries,
		db: {
			schema: 'public',
			query: async (sql: string, params: any[] = []) => {
				queries.push({ sql, params })
				return { rows: [], rowCount: 0 }
			},
		} as any,
	}
}

test('truncate events command clears the event log and records a truncate event', async () => {
	const { db, queries } = createMockDb()
	let uuidCounter = 100
	const providers = { uuid: () => testUuid(uuidCounter++) }

	const command = new TruncateEventsCommand(testUuid(1), [testUuid(2), testUuid(3)])
	await command.execute({ db, providers, bus: {} as any })

	// 1x delete + 1x insert into event_data + 2x insert into stage_transaction
	expect(queries.length).toBe(4)

	const [del, insertEvent, stage1, stage2] = queries

	expect(del.sql).toContain('delete from')
	expect(del.sql).toContain('"event_data"')

	expect(insertEvent.sql).toContain('insert into')
	expect(insertEvent.sql).toContain('"event_data"')
	expect(insertEvent.sql).toContain('clock_timestamp()')
	expect(insertEvent.sql).toContain('MAX("id")')
	expect(insertEvent.sql).toContain('"schema_migration"')
	// type 'truncate' and identity id are passed as bound params
	expect(insertEvent.params).toContain('truncate')
	expect(insertEvent.params).toContain(testUuid(1))

	for (const stageInsert of [stage1, stage2]) {
		expect(stageInsert.sql).toContain('insert into')
		expect(stageInsert.sql).toContain('"stage_transaction"')
		expect(stageInsert.sql).toContain('on conflict')
		expect(stageInsert.sql).toContain('do nothing')
	}
	// both stages linked to the same (single) truncate transaction
	const stageIds = [...stage1.params, ...stage2.params]
	expect(stageIds).toContain(testUuid(2))
	expect(stageIds).toContain(testUuid(3))
})
