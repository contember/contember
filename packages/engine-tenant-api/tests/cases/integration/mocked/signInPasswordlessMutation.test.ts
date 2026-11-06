import { executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { signInPasswordlessMutation } from './gql/passwordless.js'
import { computeTokenHash } from '../../../../src/index.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'

const isDate = (val: unknown) => val instanceof Date

const personTokenByIdSql = (args: {
	requestId: string
	personId: string
	token: string
}) => ({
	sql: SQL`SELECT *, "expires_at" <= now() as "is_expired" FROM "tenant"."person_token" WHERE "id" = ? AND "type" = ?`,
	parameters: [args.requestId, 'passwordless'],
	response: {
		rows: [
			{
				id: args.requestId,
				token_hash: computeTokenHash(args.token),
				person_id: args.personId,
				created_at: now,
				expires_at: new Date(now.getTime() + 60 * 60 * 1000),
				is_expired: false,
				used_at: null,
				otp_hash: null,
				otp_attempts: 0,
				meta: null,
			},
		],
	},
})

test('signInPasswordless - marks an unverified email verified before issuing the session', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	const token = 'passwordless-token'
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token, validationType: 'token' }),
		executes: [
			...sqlTransaction(
				personTokenByIdSql({ requestId, personId, token }),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: null },
				}),
				localAuthDisablingIdpsSql({ personId }),
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, requestId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`UPDATE "tenant"."person" SET "email_verified_at" = ? WHERE "id" = ?`,
					parameters: [isDate, personId],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// SignInResponseFactory resolves the signed-in identity's projects when
			// building the response (no memberships follow because none are returned).
			{
				...getIdentityProjectsSql({ identityId, projectId }),
				response: { rows: [] },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: true,
					error: null,
					result: {
						token: expect.stringMatching(/\w+/),
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('signInPasswordless - skips the email-verified update when already verified', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	const token = 'passwordless-token'
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token, validationType: 'token' }),
		executes: [
			...sqlTransaction(
				personTokenByIdSql({ requestId, personId, token }),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: now },
				}),
				localAuthDisablingIdpsSql({ personId }),
				{
					sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
					parameters: [isDate, requestId],
					response: { rowCount: 1 },
				},
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// SignInResponseFactory resolves the signed-in identity's projects when
			// building the response (no memberships follow because none are returned).
			{
				...getIdentityProjectsSql({ identityId, projectId }),
				response: { rows: [] },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: true,
					error: null,
					result: {
						token: expect.stringMatching(/\w+/),
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('signInPasswordless - a link created while the magic link was in flight still refuses the session', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	const token = 'passwordless-token'
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token, validationType: 'token' }),
		executes: [
			...sqlTransaction(
				personTokenByIdSql({ requestId, personId, token }),
				getPersonByIdSql({
					personId,
					response: { personId, identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: now },
				}),
				localAuthDisablingIdpsSql({ personId, slugs: ['corporateSso'] }),
			),
		],
		return: {
			data: {
				signInPasswordless: {
					ok: false,
					error: { code: 'IDP_REQUIRED' },
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

const OTP_CODE = '123456'

const otpTokenSql = (args: { requestId: string; personId: string; otpAttempts: number }) => {
	const query = personTokenByIdSql({ requestId: args.requestId, personId: args.personId, token: 'passwordless-token' })
	return {
		...query,
		response: { rows: query.response.rows.map(row => ({ ...row, otp_hash: computeTokenHash(OTP_CODE), otp_attempts: args.otpAttempts })) },
	}
}

const claimAttemptSql = (args: { requestId: string; claimed: boolean }) => ({
	sql: SQL`UPDATE "tenant"."person_token" SET "otp_attempts" = otp_attempts + 1 WHERE "id" = ? AND "used_at" IS NULL AND "otp_attempts" < ?`,
	parameters: [args.requestId, 3],
	response: { rowCount: args.claimed ? 1 : 0 },
})

test('signInPasswordless - a wrong code is counted before it is checked and the token expires at the limit', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token: '000000', validationType: 'otp' }),
		executes: [
			otpTokenSql({ requestId, personId, otpAttempts: 2 }),
			claimAttemptSql({ requestId, claimed: true }),
			...sqlTransaction(otpTokenSql({ requestId, personId, otpAttempts: 3 })),
			{
				sql: SQL`UPDATE "tenant"."person_token" SET "expires_at" = now() WHERE "id" = ? AND "used_at" IS NULL AND "otp_attempts" >= ?`,
				parameters: [requestId, 3],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: false,
					error: { code: 'TOKEN_INVALID' },
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

const personWithTotpSql = (args: { personId: string; identityId: string }) => {
	const query = getPersonByIdSql({
		personId: args.personId,
		response: { personId: args.personId, identityId: args.identityId, password: '123', roles: [], email: 'john@doe.com', emailVerifiedAt: now },
	})
	const rows = query.response.rows ?? []
	return {
		...query,
		response: { rows: rows.map(row => ({ ...row, otp_secret: Buffer.from('JBSWY3DPEHPK3PXP'), otp_secret_version: 0, otp_activated_at: now })) },
	}
}

test('signInPasswordless - a right code that still needs a TOTP gives its attempt back', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token: OTP_CODE, validationType: 'otp' }),
		executes: [
			otpTokenSql({ requestId, personId, otpAttempts: 0 }),
			claimAttemptSql({ requestId, claimed: true }),
			...sqlTransaction(
				otpTokenSql({ requestId, personId, otpAttempts: 1 }),
				personWithTotpSql({ personId, identityId }),
				localAuthDisablingIdpsSql({ personId }),
			),
			{
				sql: SQL`UPDATE "tenant"."person_token" SET "otp_attempts" = otp_attempts - 1 WHERE "id" = ? AND "otp_attempts" > ?`,
				parameters: [requestId, 0],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: {
				signInPasswordless: {
					ok: false,
					error: { code: 'OTP_REQUIRED' },
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('signInPasswordless - a code is not checked once the attempts are used up', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token: OTP_CODE, validationType: 'otp' }),
		executes: [
			otpTokenSql({ requestId, personId, otpAttempts: 3 }),
			claimAttemptSql({ requestId, claimed: false }),
		],
		return: {
			data: {
				signInPasswordless: {
					ok: false,
					error: { code: 'TOKEN_EXPIRED' },
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('signInPasswordless - an MFA code with a wrong link token spends no attempt', async () => {
	const requestId = testUuid(1)
	const personId = testUuid(2)
	await executeTenantTest({
		query: signInPasswordlessMutation({ requestId, token: 'wrong-link-token', validationType: 'token', mfaOtp: OTP_CODE }),
		executes: [
			personTokenByIdSql({ requestId, personId, token: 'passwordless-token' }),
			...sqlTransaction(personTokenByIdSql({ requestId, personId, token: 'passwordless-token' })),
		],
		return: {
			data: {
				signInPasswordless: {
					ok: false,
					error: { code: 'TOKEN_INVALID' },
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'passwordless_login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})
