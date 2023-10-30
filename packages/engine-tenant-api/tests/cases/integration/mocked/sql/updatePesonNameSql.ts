import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export const updatePersonProfileNameSql = (args: { personId: string; name: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "name" = ?
	         WHERE "id" = ?`,
	parameters: [args.name, args.personId],
	response: { rowCount: 1 },
})

export const updatePersonProfileEmailSql = (args: { personId: string; email: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "email" = ?
	         WHERE "id" = ?`,
	parameters: [args.email, args.personId],
	response: { rowCount: 1 },
})

export const updatePersonProfileNameAndEmailSql = (args: { personId: string; email: string | null; name: string | null }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "email" = ?, "name" = ?
	         WHERE "id" = ?`,
	parameters: [args.email, args.name, args.personId],
	response: { rowCount: 1 },
})
