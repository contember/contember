import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const createApiKeySql = (args: { apiKeyId: string; identityId: string; trustForwardedInfo?: boolean }): ExpectedQuery => ({
	sql:
		SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at", "created_ip", "created_user_agent", "trust_forwarded_info")
	         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
	],
	response: {
		rowCount: 1,
	},
})
