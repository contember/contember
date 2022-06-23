import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const updatePersonPasswordSql = (args: { personId: string; password: string }): ExpectedQuery => ({
	sql: SQL`UPDATE "tenant"."person"
	         SET "password_hash" = ?
	         WHERE "id" = ?`,
	parameters: [`BCRYPTED-${args.password}`, args.personId],
	response: { rowCount: 1 },
})
