import { executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { signInMutation } from './gql/signIn.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getAllProjectRolesByIdentitySql, getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { generateBackupCodesSql } from './sql/generateBackupCodesSql.js'
import { expect, test } from 'bun:test'
import { Buffer } from 'buffer'
import PostgresInterval from 'postgres-interval'
import { OtpAuthenticator } from '../../../../src/index.js'
import { GQL } from '../../../src/tags.js'

const encryptProvider = {
	encrypt: (value: Buffer) => Promise.resolve({ value: Buffer.concat([Buffer.from('ENC:'), value]), version: 1 }),
	encryptionEnabled: true,
}

// signIn query that also reads the additive mfaEnrollment payload + backupCodes.
const signInWithMfa = (variables: { email: string; password: string; otpToken?: string }) => ({
	query: GQL`mutation($email: String!, $password: String!, $otpToken: String) {
		signIn(email: $email, password: $password, otpToken: $otpToken) {
			ok
			error { code mfaEnrollment { otpUri otpSecret } }
			result { token backupCodes }
		}
	}`,
	variables,
})

const requiringPolicy = () => getAuthPoliciesSql([{ id: testUuid(900), scope: 'global', roles: ['editor'], mfaRequired: true }])

test('MFA required + no factor + no code → MFA_ENROLLMENT_REQUIRED with pending secret + audit', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		providers: encryptProvider,
		query: signInWithMfa({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'] } }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			// Enforcement resolves the grace duration: the matched policy has no
			// grace override, so the global config default (0 = immediate) is read.
			getConfigSql(),
			{
				// prepareOtp writes the pending slot.
				sql: `insert into "tenant"."person_mfa" ("person_id", "totp_pending_secret", "totp_pending_version", "totp_pending_created_at")
					values (?, ?, ?, ?)
					on conflict ("person_id")
					do update set "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?`,
				parameters: [
					personId,
					(value: Buffer) => Buffer.isBuffer(value) && value.toString('utf8').startsWith('ENC:'),
					1,
					now,
					(value: Buffer) => Buffer.isBuffer(value) && value.toString('utf8').startsWith('ENC:'),
					1,
					now,
				],
				response: { rowCount: 1 },
			},
		],
		return: (response: any) => {
			expect(response.data.signIn.ok).toBe(false)
			expect(response.data.signIn.error.code).toBe('MFA_ENROLLMENT_REQUIRED')
			expect(response.data.signIn.error.mfaEnrollment.otpUri).toMatch(/otpauth:.+/)
			expect(typeof response.data.signIn.error.mfaEnrollment.otpSecret).toBe('string')
			expect(response.data.signIn.result).toBeNull()
		},
		expectedAuthLog: [
			{
				type: 'login',
				response: expect.objectContaining({ ok: false }),
			},
			expect.objectContaining({
				type: 'mfa_enrollment_required',
				response: expect.objectContaining({ ok: false }),
			}),
		],
	})
})

test('MFA required + valid pending code → enrolls (pending→active), returns backup codes, signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	// Backup-code generation consumes uuids 1..10, so the session api key gets uuid 11.
	const apiKeyId = testUuid(11)
	const projectId = testUuid(20)

	// The person already has a pending TOTP secret (from a prior enrollment-required step).
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')

	await executeTenantTest({
		query: signInWithMfa({ email, password, otpToken: otpAuth.generate(otp) }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'], otpPendingUri: otp.uri } }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			// Enforcement resolves the grace duration from the global config default.
			getConfigSql(),
			{
				// confirmOtp promotes pending → active (only while a pending secret is present).
				sql: `update "tenant"."person_mfa"
					set "totp_secret" = "totp_pending_secret", "totp_secret_version" = "totp_pending_version", "totp_activated_at" = ?, "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?
					where "person_id" = ? and "totp_pending_secret" is not null`,
				parameters: [now, null, null, null, personId],
				response: { rowCount: 1 },
			},
			...generateBackupCodesSql({ personId, firstUuidIndex: 1 }),
			getConfigSql(),
			getIdentityByIdSql({ identityId, roles: ['editor'] }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			createSessionKeySql({ apiKeyId, identityId }),
			{
				// A19: the requiring (mfaRequired) policy is non-inert, so
				// createSessionApiKey emits a session_policy_applied audit entry.
				// No personId is passed → the person_id column is omitted by the InsertBuilder.
				sql: `insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "metadata", "event_data") values  (?, ?, ?, ?, ?, ?)`,
				parameters: [
					() => true,
					identityId,
					'session_policy_applied',
					true,
					() => true,
					() => true,
				],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: (response: any) => {
			expect(response.data.signIn.ok).toBe(true)
			expect(response.data.signIn.result.token).toBe('0000000000000000000000000000000000000000')
			expect(response.data.signIn.result.backupCodes).toHaveLength(10)
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('MFA required + invalid pending code → INVALID_OTP_TOKEN', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const pendingUri = 'otpauth://totp/contember:john?secret=ABDEF&period=30&digits=6&algorithm=SHA1&issuer=contember'
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: '111111' }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'], otpPendingUri: pendingUri } }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			// Enforcement resolves the grace duration from the global config default.
			getConfigSql(),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_OTP_TOKEN' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('active TOTP + requiring policy → existing OTP_REQUIRED path (policy not consulted)', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otpUri = 'otpauth://totp/contember:john?secret=ABCDEFG&period=30&digits=6&algorithm=SHA1&issuer=contember'
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'], otpUri } }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'OTP_REQUIRED' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

// A policy whose grace_duration is set opens a grace window: the person is let in
// on the first hit, `mfa_grace_until` is anchored, and no enrollment is forced.
const gracePolicy = () =>
	getAuthPoliciesSql([{ id: testUuid(900), scope: 'global', roles: ['editor'], mfaRequired: true, graceDuration: '01:00:00' }])

test('MFA required + per-policy grace → opens grace window, sets mfa_grace_until, signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(20)
	await executeTenantTest({
		query: signInWithMfa({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'] } }),
			gracePolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			// Per-policy grace override is present → the global config is NOT read here.
			{
				// Grace window opened on the DB clock: now() + 1h (3600s).
				sql: SQL`update "tenant"."person" set "mfa_grace_until" = now() + make_interval(secs => ?) where "id" = ?`,
				parameters: [3600, personId],
				response: { rowCount: 1 },
			},
			getConfigSql(),
			getIdentityByIdSql({ identityId, roles: ['editor'] }),
			gracePolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			createSessionKeySql({ apiKeyId, identityId }),
			{
				// A19: the requiring policy is non-inert → session_policy_applied audit.
				sql: `insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "metadata", "event_data") values  (?, ?, ?, ?, ?, ?)`,
				parameters: [() => true, identityId, 'session_policy_applied', true, () => true, () => true],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: (response: any) => {
			expect(response.data.signIn.ok).toBe(true)
			expect(response.data.signIn.result.token).toBe('0000000000000000000000000000000000000000')
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('MFA required + no policy grace override → global config default opens the grace window', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(20)
	await executeTenantTest({
		query: signInWithMfa({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: ['editor'] } }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			// No per-policy override → the global config default is read; here it is
			// non-zero (2h), so a grace window opens instead of forcing enrollment.
			getConfigSql({ login_mfa_grace_duration: PostgresInterval('02:00:00') }),
			{
				// Grace window opened on the DB clock: now() + 2h (7200s).
				sql: SQL`update "tenant"."person" set "mfa_grace_until" = now() + make_interval(secs => ?) where "id" = ?`,
				parameters: [7200, personId],
				response: { rowCount: 1 },
			},
			getConfigSql(),
			getIdentityByIdSql({ identityId, roles: ['editor'] }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			createSessionKeySql({ apiKeyId, identityId }),
			{
				sql: `insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "metadata", "event_data") values  (?, ?, ?, ?, ?, ?)`,
				parameters: [() => true, identityId, 'session_policy_applied', true, () => true, () => true],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: (response: any) => {
			expect(response.data.signIn.ok).toBe(true)
			expect(response.data.signIn.result.token).toBe('0000000000000000000000000000000000000000')
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})
