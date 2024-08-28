import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createPersonTokenSql = (args: {
	resetId: string
	tokenHash: string
	personId: string
	type: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type")
	         VALUES (?, ?, ?, ?, ?, ?, ?)`,
	parameters: [
		args.resetId,
		args.tokenHash,
		args.personId,
		(val: any) => val instanceof Date,
		(val: any) => val instanceof Date,
		null,
		args.type,
	],
	response: { rowCount: 1 },
})
