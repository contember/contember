import { SQL } from '../../../../src/tags'

export const createSessionKeySql = function({ apiKeyId, identityId, ip, userAgent, trustForwardedInfo }: {
	apiKeyId: string
	identityId: string
	ip?: string | null
	userAgent?: string | null
	trustForwardedInfo?: boolean
}) {
	return {
		sql: SQL`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at",
												 "expiration", "created_at", "created_ip", "created_user_agent", "trust_forwarded_info")
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		parameters: [
			apiKeyId,
			'9692e67b8378a6f6753f97782d458aa757e947eab2fbdf6b5c187b74561eb78f',
			'session',
			identityId,
			null,
			new Date('2019-09-04 12:30'),
			30,
			new Date('2019-09-04 12:00'),
			ip ?? null,
			userAgent ?? null,
			trustForwardedInfo ?? false,
		],
		response: { rowCount: 1 },
	}
}
