import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createPersonSql = (args: {
	personId: string
	email?: string
	name?: string
	password?: string
	identityId: string
	idpOnly?: boolean
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person" ("id", "email", "name", "password_hash", "identity_id", "idp_only")
	         VALUES (?, ?, ?, ?, ?, ?)`,
	parameters: [args.personId, args.email ?? null, args.name ?? args.email?.split('@')[0], args.password ? `BCRYPTED-${args.password}` : null, args.identityId, args.idpOnly ?? false],
	response: { rowCount: 1 },
})
