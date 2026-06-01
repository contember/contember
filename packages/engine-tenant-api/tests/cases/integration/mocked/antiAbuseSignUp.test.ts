import { test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { signUpMutation } from './gql/signUp.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { ExpectedQuery } from '@contember/database-tester'

const email = 'john@doe.com'
const password = '123456'

// Mirrors RateLimitCountQuery — whitespace/case are normalised by the matcher.
const rateLimitCountSql = (args: { scope: string; keyHash: Buffer; count: number }): ExpectedQuery => ({
	sql: `select count(*)::text as count from "tenant"."rate_limit_event"
		where "scope" = ? and "key_hash" = ? and "occurred_at" >= ?`,
	parameters: [args.scope, args.keyHash, (val: unknown) => val instanceof Date],
	response: { rows: [{ count: String(args.count) }] },
})

test('signUp returns RATE_LIMIT_EXCEEDED when the per-IP window is full', async () => {
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		httpInfo: { ip: '1.2.3.4' },
		executes: [
			getConfigSql({ rate_limit_sign_up_per_ip_limit: 1 }),
			// already 1 attempt in the window, limit is 1 → blocked, and crucially
			// no INSERT follows: a denied attempt must not extend the window.
			rateLimitCountSql({ scope: 'sign_up_per_ip', keyHash: Buffer.from('1.2.3.4'), count: 1 }),
		],
		return: {
			data: {
				signUp: {
					ok: false,
					errors: [{ code: 'RATE_LIMIT_EXCEEDED' }],
					result: null,
				},
			},
		},
	})
})

test('signUp returns INVALID_CAPTCHA when captcha is enabled but no token is supplied', async () => {
	await executeTenantTest({
		query: signUpMutation({ email, password }),
		// captcha_secret is decrypted by ConfigurationQuery, so a working decrypt
		// provider is required to reach the captcha gate.
		providers: {
			decrypt: async () => ({ value: Buffer.from('turnstile-secret'), needsReEncrypt: false }),
		},
		executes: [
			getConfigSql({
				captcha_provider: 'turnstile',
				captcha_secret: Buffer.from('encrypted'),
				captcha_secret_version: 1,
			}),
			// rate limits stay at 0 and the test IP is empty, so the limiter
			// short-circuits before any DB call — captcha is the only gate hit.
		],
		return: {
			data: {
				signUp: {
					ok: false,
					errors: [{ code: 'INVALID_CAPTCHA' }],
					result: null,
				},
			},
		},
	})
})
