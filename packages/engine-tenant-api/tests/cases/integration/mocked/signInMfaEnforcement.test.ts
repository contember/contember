import { executeTenantTest, now } from '../../../src/testTenant'
import { SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { signInMutation } from './gql/signIn'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { getConfigSql } from './sql/getConfigSql'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql'
import { createSessionKeySql } from './sql/createSessionKeySql'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql'
import { selectMembershipsSql } from './sql/selectMembershipsSql'
import { getAllProjectRolesByIdentitySql, getAuthPoliciesSql } from './sql/authPolicySql'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql'
import { generateBackupCodesSql } from './sql/generateBackupCodesSql'
import { expect, test } from 'bun:test'
import { Buffer } from 'buffer'
import { OtpAuthenticator } from '../../../../src'
import { GQL } from '../../../src/tags'

const encryptProvider = {
	encrypt: (value: Buffer) => Promise.resolve({ value: Buffer.concat([Buffer.from('ENC:'), value]), version: 1 }),
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
			{
				// confirmOtp promotes pending → active.
				sql: `update "tenant"."person_mfa"
					set "totp_secret" = "totp_pending_secret", "totp_secret_version" = "totp_pending_version", "totp_activated_at" = ?, "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?
					where "person_id" = ?`,
				parameters: [now, null, null, null, personId],
				response: { rowCount: 1 },
			},
			...generateBackupCodesSql({ personId, firstUuidIndex: 1 }),
			getConfigSql(),
			getIdentityByIdSql({ identityId, roles: ['editor'] }),
			requiringPolicy(),
			getAllProjectRolesByIdentitySql({ identityId }),
			createSessionKeySql({ apiKeyId, identityId }),
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
