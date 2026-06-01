import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const updatePersonProfileNameSql = (args: { personId: string; name: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "name" = ?
	         WHERE "id" = ?`,
	parameters: [args.name, args.personId],
	response: { rowCount: 1 },
})

// A direct e-mail change clears email_verified_at: the new address is unproven,
// so a stale verified timestamp must not carry over (see ChangeProfileCommand).
export const updatePersonProfileEmailSql = (args: { personId: string; email: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "email" = ?, "email_verified_at" = ?
	         WHERE "id" = ?`,
	parameters: [args.email, null, args.personId],
	response: { rowCount: 1 },
})

export const updatePersonProfileNameAndEmailSql = (args: { personId: string; email: string | null; name: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "email" = ?, "name" = ?, "email_verified_at" = ?
	         WHERE "id" = ?`,
	parameters: [args.email, args.name, null, args.personId],
	response: { rowCount: 1 },
})
