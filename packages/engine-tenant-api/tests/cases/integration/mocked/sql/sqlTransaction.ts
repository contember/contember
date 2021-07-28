import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
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
