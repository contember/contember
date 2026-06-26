import { executeTenantTest } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { requestEmailVerificationMutation } from './gql/emailVerification.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getNextMailAttemptSql } from './sql/getNextMailAttemptSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { ExpectedQuery } from '@contember/database-tester'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

// Mirrors RateLimitCountQuery — whitespace/case are normalised by the matcher.
const rateLimitCountSql = (args: { scope: string; keyHash: Buffer; count: number }): ExpectedQuery => ({
	sql: `select count(*)::text as count from "tenant"."rate_limit_event"
		where "scope" = ? and "key_hash" = ? and occurred_at >= NOW() - make_interval(secs => ?)`,
	parameters: [args.scope, args.keyHash, (val: unknown) => typeof val === 'number'],
	response: { rows: [{ count: String(args.count) }] },
})

// Anti-enumeration: an unknown address still reports ok and does nothing
// observable — no mail, no auth-log entry — so the endpoint can't be used to
// probe which addresses are registered.
test('requestEmailVerification - unknown email reports ok without sending mail', async () => {
	const email = 'ghost@example.com'
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		executes: [
			// Config is fetched first for the per-IP rate limit + captcha gate
			// (both disabled by default), then the anti-enumeration lookup.
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: true,
					error: null,
				},
			},
		},
		// No mail goes out, so no `email_verify_init` audit entry is recorded.
		sentMails: [],
	})
})

// A known, still-unverified address gets a verification mail and an
// `email_verify_init` audit entry. Rate-limiting runs before the token write.
test('requestEmailVerification - sends a verification mail for an unverified person', async () => {
	const email = 'jane@doe.com'
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		executes: [
			getConfigSql(),
			getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles: [], emailVerifiedAt: null } }),
			getNextMailAttemptSql({ email, initType: 'email_verify_init', completionType: 'email_verify_complete' }),
			{
				sql: SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "meta")
				         VALUES (?, ?, ?, now() + make_interval(secs => ?), ?, ?, ?, ?)`,
				parameters: [
					anyString,
					anyString,
					personId,
					(val: any) => typeof val === 'number',
					isDate,
					null,
					'email_verification',
					(val: any) => !!val && val.email === email,
				],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			getMailTemplateSql({ type: 'emailVerification', projectId }),
			getMailTemplateSql({ type: 'emailVerification', projectId: null }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_init',
			personId,
			personInput: email,
			response: expect.objectContaining({ ok: true }),
		}),
		sentMails: [
			{
				subject: 'Verify your e-mail address',
			},
		],
	})
})

// Per-IP rate limit mirrors createResetPasswordRequest: when the window is
// full the request is rejected before any person lookup or mail, and crucially
// no INSERT follows so a denied attempt does not extend the window.
test('requestEmailVerification - returns RATE_LIMIT_EXCEEDED when the per-IP window is full', async () => {
	const email = 'jane@doe.com'
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		httpInfo: { ip: '1.2.3.4' },
		executes: [
			getConfigSql({ rate_limit_email_verification_per_ip_limit: 1 }),
			rateLimitCountSql({ scope: 'email_verification_per_ip', keyHash: Buffer.from('1.2.3.4'), count: 1 }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: false,
					error: { code: 'RATE_LIMIT_EXCEEDED' },
				},
			},
		},
		// Rejected before the anti-enumeration lookup, so nothing is sent.
		sentMails: [],
	})
})

// Captcha gate mirrors createResetPasswordRequest: when captcha is configured
// AND enforced for this flow but no token is supplied, the request is rejected
// before any person lookup. Email verification is opt-in, so the test enables
// `captcha_protect_email_verification` explicitly.
test('requestEmailVerification - returns INVALID_CAPTCHA when captcha is enabled for this flow but no token is supplied', async () => {
	const email = 'jane@doe.com'
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		providers: {
			decrypt: async () => ({ value: Buffer.from('turnstile-secret'), needsReEncrypt: false }),
		},
		executes: [
			getConfigSql({
				captcha_provider: 'turnstile',
				captcha_secret: Buffer.from('encrypted'),
				captcha_secret_version: 1,
				captcha_protect_email_verification: true,
			}),
			// rate limits stay at 0 and the test IP is empty, so the limiter
			// short-circuits before any DB call — captcha is the only gate hit.
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: false,
					error: { code: 'INVALID_CAPTCHA' },
				},
			},
		},
		sentMails: [],
	})
})

// With captcha configured but NOT enforced for email verification (the default),
// the flow skips the captcha gate entirely and proceeds to the normal lookup.
test('requestEmailVerification - skips captcha when not enforced for this flow', async () => {
	const email = 'ghost@example.com'
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		providers: {
			decrypt: async () => ({ value: Buffer.from('turnstile-secret'), needsReEncrypt: false }),
		},
		executes: [
			getConfigSql({
				captcha_provider: 'turnstile',
				captcha_secret: Buffer.from('encrypted'),
				captcha_secret_version: 1,
				// captcha_protect_email_verification defaults to false → gate skipped,
				// so we reach the anti-enumeration lookup without a captcha token.
			}),
			getPersonByEmailSql({ email, response: null }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: true,
					error: null,
				},
			},
		},
		sentMails: [],
	})
})
