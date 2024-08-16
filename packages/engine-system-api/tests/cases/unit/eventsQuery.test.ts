import { expect, test } from 'vitest'
import { EventsQuery } from '../../../src/model'
import { testUuid } from '../../src/uuid'
import { EventsOrder } from '../../../src/schema'

test('events query', async () => {
	const query = new EventsQuery({
		rows: [
			{ tableName: 'table1', primaryKey: [testUuid(1)] },
			{ tableName: 'table2', primaryKey: [testUuid(2), testUuid(3)] },
			{ tableName: 'table3', primaryKey: [null, testUuid(3)] },
		],
	}, EventsOrder.CreatedAtAsc, 0, 10)

	let called = false
	await query.fetch({
		db: {
			schema: 'public',
			query: async (sql: string, params: any) => {
				called = true
				expect(sql).toMatchInlineSnapshot(`"select "id", "type", "table_name", "row_ids", "values", "created_at", "applied_at", "identity_id", "event_data"."transaction_id"  from "public"."event_data" inner join  "public"."stage_transaction" on  "event_data"."transaction_id" = "stage_transaction"."transaction_id"  where ("table_name" = ? and "row_ids"->0 = ?::jsonb or "table_name" = ? and "row_ids"->0 = ?::jsonb and "row_ids"->1 = ?::jsonb or "table_name" = ? and "row_ids"->1 = ?::jsonb)  order by "created_at" asc  limit 10 offset 0"`)
				expect(params).toMatchInlineSnapshot(`
					[
					  "table1",
					  ""123e4567-e89b-12d3-a456-000000000001"",
					  "table2",
					  ""123e4567-e89b-12d3-a456-000000000002"",
					  ""123e4567-e89b-12d3-a456-000000000003"",
					  "table3",
					  ""123e4567-e89b-12d3-a456-000000000003"",
					]
				`)

				return { rows: [] }
			},
		},
	} as any)
	expect(called).toBe(true)
})
