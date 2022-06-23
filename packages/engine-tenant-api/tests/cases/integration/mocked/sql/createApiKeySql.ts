import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

export const createApiKeySql = (args: { apiKeyId: string; identityId: string }): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at")
	         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	parameters: [
		args.apiKeyId,
		() => true,
		'permanent',
		args.identityId,
		null,
		null,
		null,
		(val: any) => val instanceof Date,
	],
	response: {
		rowCount: 1,
	},
})
