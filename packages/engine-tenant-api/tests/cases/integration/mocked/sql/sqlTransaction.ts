import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'
export const sqlTransaction = (...queries: ExpectedQuery[]): ExpectedQuery[] => [
	{
		sql: SQL`BEGIN;`,
		response: { rowCount: 1 },
	},
	{
		sql: SQL`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`,
		response: { rowCount: 1 },
	},
	...queries,
	{
		sql: SQL`COMMIT;`,
		response: { rowCount: 1 },
	},
]

/**
 * A nested `client.transaction()` inside an open transaction. Postgres runs it as a savepoint; the
 * connection mock renders every transaction as BEGIN/COMMIT and sets no isolation level for it.
 */
export const sqlNestedTransaction = (...queries: ExpectedQuery[]): ExpectedQuery[] => [
	{
		sql: SQL`BEGIN;`,
		response: { rowCount: 1 },
	},
	...queries,
	{
		sql: SQL`COMMIT;`,
		response: { rowCount: 1 },
	},
]
