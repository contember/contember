import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createPersonSql = (args: {
	personId: string
	email: string
	name?: string
	password?: string
	identityId: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person" ("id", "email", "name", "password_hash", "identity_id")
	         VALUES (?, ?, ?, ?, ?)`,
	parameters: [args.personId, args.email, args.name ?? args.email, args.password ? `BCRYPTED-${args.password}` : null, args.identityId],
	response: { rowCount: 1 },
})
