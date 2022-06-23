import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

export const createPersonSql = (args: {
	personId: string
	email: string
	password?: string
	identityId: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person" ("id", "email", "password_hash", "identity_id")
	         VALUES (?, ?, ?, ?)`,
	parameters: [args.personId, args.email, args.password ? `BCRYPTED-${args.password}` : null, args.identityId],
	response: { rowCount: 1 },
})
