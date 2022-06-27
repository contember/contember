import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'
import { now } from '../../../../src/testTenant'

export const createIdentitySql = (args: {
	identityId: string
	roles?: string[]
	description?: string
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at")
	         VALUES (?, ?, ?, ?, ?)`,
	parameters: [args.identityId, null, JSON.stringify(args.roles || []), args.description || null, now],
	response: {
		rowCount: 1,
	},
})
