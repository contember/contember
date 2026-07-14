import { executeTenantTest, now } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { signInMutation } from './gql/signIn.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { expect, test } from 'bun:test'
import { OtpAuthenticator } from '../../../../src/index.js'
import { Buffer } from 'buffer'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getLoginHistorySql } from './sql/loginHistorySql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { claimEmailOtpAttemptSql, consumeEmailOtpTokenSql, EMAIL_OTP_CODE, getLatestEmailOtpTokenSql, sendEmailOtpSql } from './sql/emailOtpSql.js'
import { ExpectedQuery } from '@contember/database-tester'

// Enabled anomaly policy (default thresholds): email >= 1, step-up >= 3.
const anomalyConfig = getConfigSql({ login_anomaly_detection_enabled: true })

const KNOWN_UA = 'Mozilla/5.0 (Macintosh)'
// device_fingerprint stored for a prior login from the same browser. The test
// providers' `hash` returns Buffer.from(value.toString()); the analyzer hex-encodes it.
const KNOWN_FINGERPRINT = Buffer.from(KNOWN_UA).toString('hex')

// A non-empty client IP makes the per-IP rate limiter record a sliding-window event
// (the limit is 0, so it short-circuits the count and only records). The empty-IP
// tests above skip this; the IP-signal test below sets an IP, so it appears.
const recordLoginRateLimitSql = (ip: string): ExpectedQuery => ({
	sql: `insert into  "tenant"."rate_limit_event" ("id", "scope", "key_hash") values  (?, ?, ?)`,
	parameters: [() => true, 'login_per_ip', Buffer.from(ip)],
	response: { rowCount: 1 },
})

test('anomaly off by default: a new country does not add any queries (baseline path unchanged)', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		// note: default getConfigSql → anomaly disabled. Empty ip keeps the per-IP
		// rate limiter inert (it records on any non-empty key), matching the other
		// sign-in tests; the anomaly IP-prefix signal is unit-tested separately.
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'US' },
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('anomaly on, new device only (medium): sends UNUSUAL_LOGIN email, still signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: 'Mozilla/5.0 (NewBrowser)', geoCountry: 'CZ' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			// enforceMfaEnrollment (no policies → inert, single query)
			getAuthPoliciesSql(),
			// applyRiskPolicy: history (same country, different device → medium 2) then email
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			// createSessionApiKey (A19 session-policy queries)
			anomalyConfig,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: 'Mozilla/5.0 (NewBrowser)' }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: { token: '0000000000000000000000000000000000000000' },
				},
			},
		},
		sentMails: [{ subject: 'Unusual sign-in to your account' }],
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: true }) },
			expect.objectContaining({
				type: 'unusual_login_detected',
				personId,
				eventData: { score: 2, reasons: ['new_device'] },
				response: expect.objectContaining({ ok: true }),
			}),
		],
	})
})

test('anomaly on, new country (high): requires step-up, dispatches email OTP, returns OTP_REQUIRED', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'US' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			// enforceMfaEnrollment (no policies → inert, single query)
			getAuthPoliciesSql(),
			// history: previously only ever seen in CZ → US is a new country (high, 3) → step-up.
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			// step-up reuses the email-OTP channel; sendCode is rate-limited via the passed config.
			// No session is created (OTP_REQUIRED), so no A19 queries follow.
			...sendEmailOtpSql({ personId, rateLimitEventId: testUuid(1), tokenId: testUuid(2) }),
			getMailTemplateSql({ type: 'emailOtp', projectId: null }),
			getMailTemplateSql({ type: 'emailOtp', projectId: null }),
		],
		return: {
			data: { signIn: { ok: false, errors: [{ code: 'OTP_REQUIRED' }], result: null } },
		},
		sentMails: [{ subject: 'Your verification code' }],
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: false }) },
			// step-up reuses the email-OTP channel, so the existing email_otp_sent audit fires too.
			expect.objectContaining({
				type: 'email_otp_sent',
				response: expect.objectContaining({ ok: false }),
			}),
			expect.objectContaining({
				type: 'unusual_login_detected',
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: false }),
			}),
			expect.objectContaining({
				type: 'step_up_required',
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: false }),
			}),
		],
	})
})

test('anomaly on, step-up retry with the emailed code: consumes it and signs in (no standing MFA)', async () => {
	// Regression: a person without TOTP or email-OTP enabled must be able to complete
	// the anomaly step-up by resending the emailed code as otpToken. The step-up code
	// is consumed via the email-OTP channel independently of `email_otp_enabled`;
	// without that the score never changes and sign-in loops on OTP_REQUIRED forever.
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const tokenId = testUuid(50)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: EMAIL_OTP_CODE }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'US' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			// enforceMfaEnrollment (no policies → inert; otpToken is ignored here)
			getAuthPoliciesSql(),
			// previously only ever seen in CZ → US is a new country (high, 3) → step-up.
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			// step-up retry: consume the emailed code via the email-OTP channel.
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
			consumeEmailOtpTokenSql({ tokenId }),
			// satisfied → informational UNUSUAL_LOGIN email, then issue the session.
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			anomalyConfig,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		sentMails: [{ subject: 'Unusual sign-in to your account' }],
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: true }) },
			expect.objectContaining({
				type: 'unusual_login_detected',
				personId,
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: true }),
			}),
		],
	})
})

test('anomaly on, step-up retry with a wrong code: INVALID_OTP_TOKEN, no session', async () => {
	// The emailed step-up code is wrong → rejected (not re-sent), mirroring the A05
	// contract. The per-code attempt cap still applies; a fresh code is issued only
	// when the client retries without a code.
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const tokenId = testUuid(50)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: '111111' }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'US' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			// wrong code: token is found and an attempt is claimed, but validation fails.
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
		],
		return: {
			data: { signIn: { ok: false, errors: [{ code: 'INVALID_OTP_TOKEN' }], result: null } },
		},
		// A failed *forced* step-up is itself an anomaly: it is audited as
		// unusual_login_detected + step_up_required (with the score/reasons), not just a
		// bare failed login indistinguishable from an ordinary mistyped 2FA code.
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: false }) },
			expect.objectContaining({
				type: 'unusual_login_detected',
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: false }),
			}),
			expect.objectContaining({
				type: 'step_up_required',
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: false }),
			}),
		],
	})
})

test('anomaly on, step-up scored for a user who already cleared TOTP this request: no re-challenge, emails + signs in', async () => {
	// A login that already proved a standing second factor (active TOTP) in THIS
	// request must NOT be challenged again by the anomaly step-up (no email OTP), yet
	// a high score must still send the informational UNUSUAL_LOGIN email and issue the
	// session. Guards the `&& !mfaSatisfiedThisRequest` gate in applyRiskPolicy: a
	// regression dropping it would re-challenge an already-2FA'd user (storm), and one
	// skipping the fall-through would drop the notification — neither is otherwise
	// covered (every other case here uses a person with no standing MFA).
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: otpAuth.generate(otp) }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'US' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
			// active TOTP + valid token → verified here (no SQL); mfaSatisfiedThisRequest = true.
			// applyRiskPolicy: US is a new country (high, 3 → stepUp) BUT MFA already satisfied
			// this request → NO email-OTP challenge (no sendEmailOtpSql/getLatestEmailOtpTokenSql
			// in this sequence); fall through to the informational UNUSUAL_LOGIN email.
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			// createSessionApiKey (A19 session-policy queries)
			anomalyConfig,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		sentMails: [{ subject: 'Unusual sign-in to your account' }],
		// unusual_login_detected fires, but step_up_required must NOT (the factor was
		// already satisfied, so no step-up was demanded).
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: true }) },
			expect.objectContaining({
				type: 'unusual_login_detected',
				personId,
				eventData: { score: 3, reasons: ['new_country'] },
				response: expect.objectContaining({ ok: true }),
			}),
		],
	})
})

test('anomaly on, new IP prefix only (low): the client IP flows into scoring → email, still signs in', async () => {
	// Exercises the IP-prefix signal end-to-end (requestInfo.ip → LoginSignals.ip →
	// score), which the other tests leave untested by using an empty IP. Same country
	// + device as history, but a brand-new /24 → score 1 (new_ip_prefix) → email.
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	// The rate-limit record INSERT consumes the first generated uuid, so the session
	// api key is the second (unlike the empty-IP tests where it is testUuid(1)).
	const apiKeyId = testUuid(2)
	const clientIp = '203.0.113.9'
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { ip: clientIp, userAgent: KNOWN_UA, geoCountry: 'CZ' },
		executes: [
			anomalyConfig,
			recordLoginRateLimitSql(clientIp),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			// history IP is 10.0.0.5 (/24 = 10.0.0.0) → current 203.0.113.9 (/24 = 203.0.113.0)
			// is a new prefix; country + device match → score 1 → email.
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			getMailTemplateSql({ type: 'unusualLogin', projectId: null }),
			anomalyConfig,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, ip: clientIp, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		sentMails: [{ subject: 'Unusual sign-in to your account' }],
		expectedAuthLog: [
			{ type: 'login', response: expect.objectContaining({ ok: true }) },
			expect.objectContaining({
				type: 'unusual_login_detected',
				personId,
				eventData: { score: 1, reasons: ['new_ip_prefix'] },
				response: expect.objectContaining({ ok: true }),
			}),
		],
	})
})

test('anomaly on, custom historySize flows into the baseline query limit', async () => {
	// historySize is configurable; assert the override (3) reaches the SQL LIMIT.
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const anomalyConfig3 = getConfigSql({ login_anomaly_detection_enabled: true, login_anomaly_history_size: 3 })
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'CZ' },
		executes: [
			anomalyConfig3,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			// limit 3, not the default 10. Same country + device → score 0 → clean.
			getLoginHistorySql({ personId, limit: 3, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			anomalyConfig3,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: { type: 'login', response: expect.objectContaining({ ok: true }) },
	})
})

test('anomaly on, historySize <= 0 is clamped to a limit of 1', async () => {
	// A misconfigured historySize of 0 must not degrade to "no history" (which would
	// trust every login as a first login); analyze() clamps with Math.max(1, ...).
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const anomalyConfig0 = getConfigSql({ login_anomaly_detection_enabled: true, login_anomaly_history_size: 0 })
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'CZ' },
		executes: [
			anomalyConfig0,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getLoginHistorySql({ personId, limit: 1, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			anomalyConfig0,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: { type: 'login', response: expect.objectContaining({ ok: true }) },
	})
})

test('anomaly on, all signals match history: no email, no step-up, signs in cleanly', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		httpInfo: { userAgent: KNOWN_UA, geoCountry: 'CZ' },
		executes: [
			anomalyConfig,
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			// enforceMfaEnrollment (no policies → inert, single query)
			getAuthPoliciesSql(),
			// same country, same device → score 0 → allow, no email.
			getLoginHistorySql({ personId, rows: [{ geoCountry: 'CZ', deviceFingerprint: KNOWN_FINGERPRINT, ip: '10.0.0.5' }] }),
			// createSessionApiKey (A19 session-policy queries)
			anomalyConfig,
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId, userAgent: KNOWN_UA }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signIn: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})
