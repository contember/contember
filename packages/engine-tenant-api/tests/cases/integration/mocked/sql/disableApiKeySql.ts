import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const disableApiKey = (args: { id: string }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."api_key"
	         SET "disabled_at" = ?
	         WHERE "id" = ?`,
	parameters: [(val: any) => val instanceof Date, args.id],
	response: { rowCount: 1 },
})
