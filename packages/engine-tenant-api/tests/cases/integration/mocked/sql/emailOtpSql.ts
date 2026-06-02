import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from "../../../../src/tags.js"
import { now } from "../../../../src/testTenant.js"
import crypto from 'node:crypto'

const sha256 = (value: string) => crypto.createHash('sha256').update(value, 'ascii').digest('hex')

// The test providers' randomBytes returns all-zero buffers, so:
//   - the 6-digit code is "000000"
//   - generateToken's 20 random bytes hex to 40 zeros
export const EMAIL_OTP_CODE = '000000'
export const EMAIL_OTP_CODE_HASH = sha256(EMAIL_OTP_CODE)
const RANDOM_TOKEN_HASH = sha256('0'.repeat(40))

/**
 * Mocks EmailOtpManager.sendCode: consume the per-person email_otp rate limit
 * (COUNT under the default limit of 10, then record the event), invalidate prior
 * unused email-OTP tokens, then insert a new one. The caller must fetch the config
 * (getConfigSql) before this, since sendCode is rate-limited by the effective config.
 */
export const sendEmailOtpSql = (args: { personId: string; rateLimitEventId: string; tokenId: string }): ExpectedQuery[] => [
	{
		sql: SQL`select count(*)::text as count from "tenant"."rate_limit_event"
		where "scope" = ? and "key_hash" = ? and "occurred_at" >= ?`,
		// mocked hash provider stores the key verbatim; window 10min → now - 600s.
		parameters: ['email_otp_per_person', Buffer.from(args.personId), new Date(now.getTime() - 10 * 60 * 1000)],
		response: { rows: [{ count: '0' }] },
	},
	{
		sql: SQL`insert into "tenant"."rate_limit_event" ("id", "scope", "key_hash", "occurred_at") values (?, ?, ?, ?)`,
		parameters: [args.rateLimitEventId, 'email_otp_per_person', Buffer.from(args.personId), now],
		response: { rowCount: 1 },
	},
	{
		sql: SQL`update "tenant"."person_token" set "used_at" = ? where "person_id" = ? and "type" = ? and "used_at" is null`,
		parameters: [now, args.personId, 'mfa_email_otp'],
		response: { rowCount: 0 },
	},
	{
		sql:
			SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "otp_hash") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		parameters: [
			args.tokenId,
			RANDOM_TOKEN_HASH,
			args.personId,
			(v: any) => v instanceof Date,
			now,
			null,
			'mfa_email_otp',
			EMAIL_OTP_CODE_HASH,
		],
		response: { rowCount: 1 },
	},
]

/** Mocks the lookup of the latest unused email-OTP token for a person. */
export const getLatestEmailOtpTokenSql = (args: { personId: string; tokenId: string | null }): ExpectedQuery => ({
	sql: SQL`select * from "tenant"."person_token" where "person_id" = ? and "type" = ? and "used_at" is null order by "created_at" desc limit 1`,
	parameters: [args.personId, 'mfa_email_otp'],
	response: {
		rows: args.tokenId
			? [
				{
					id: args.tokenId,
					created_at: now,
					token_hash: RANDOM_TOKEN_HASH,
					used_at: null,
					expires_at: new Date(now.getTime() + 10 * 60 * 1000),
					person_id: args.personId,
					otp_hash: EMAIL_OTP_CODE_HASH,
					otp_attempts: 0,
				},
			]
			: [],
	},
})

/**
 * Mocks the atomic per-code attempt reservation (ClaimOtpAttemptCommand) that runs
 * before the code is compared. `reserved: false` mocks an exhausted/used token (0 rows).
 */
export const claimEmailOtpAttemptSql = (args: { tokenId: string; reserved?: boolean }): ExpectedQuery => ({
	sql: SQL`update "tenant"."person_token" set "otp_attempts" = otp_attempts + 1 where "id" = ? and "used_at" is null and "otp_attempts" < ?`,
	parameters: [args.tokenId, 3],
	response: { rowCount: args.reserved === false ? 0 : 1 },
})

/** Mocks consuming (invalidating) the verified email-OTP token. */
export const consumeEmailOtpTokenSql = (args: { tokenId: string }): ExpectedQuery => ({
	sql: SQL`update "tenant"."person_token" set "used_at" = ? where "id" = ? and "used_at" is null`,
	parameters: [now, args.tokenId],
	response: { rowCount: 1 },
})
