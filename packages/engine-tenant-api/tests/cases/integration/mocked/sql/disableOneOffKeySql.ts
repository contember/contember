import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const disableOneOffKeySql = (args: { id: string }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."api_key"
	         SET "disabled_at" = ?
	         WHERE "id" = ? AND "type" = ?`,
	parameters: [(val: any) => val instanceof Date, args.id, 'one_off'],
	response: { rowCount: 1 },
})
