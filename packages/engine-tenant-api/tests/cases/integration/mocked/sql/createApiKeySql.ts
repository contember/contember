import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createApiKeySql = (args: { apiKeyId: string; identityId: string; trustForwardedInfo?: boolean }): ExpectedQuery => ({
	sql:
		SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at", "created_ip", "created_user_agent", "trust_forwarded_info", "issued_at", "idle_timeout", "max_expires_at")
	         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	parameters: [
		args.apiKeyId,
		() => true,
		'permanent',
		args.identityId,
		null,
		null,
		null,
		(val: any) => val instanceof Date,
		null,
		null,
		args.trustForwardedInfo ?? false,
		// A19: permanent keys have no session policy → all null.
		null,
		null,
		null,
	],
	response: {
		rowCount: 1,
	},
})
