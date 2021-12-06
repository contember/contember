import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createPasswordResetSql = (args: {
	resetId: string
	tokenHash: string
	personId: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person_password_reset" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at")
	         VALUES (?, ?, ?, ?, ?, ?)`,
	parameters: [
		args.resetId,
		args.tokenHash,
		args.personId,
		(val: any) => val instanceof Date,
		(val: any) => val instanceof Date,
		null,
	],
	response: { rowCount: 1 },
})
