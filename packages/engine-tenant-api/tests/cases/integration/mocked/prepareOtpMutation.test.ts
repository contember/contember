import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { prepareOtpMutation } from './gql/prepareOtp.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { expect, test } from 'bun:test'
import { Buffer } from 'buffer'

test('prepare otp', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		providers: {
			// Encrypt the freshly generated secret into the pending slot (version >= 1).
			encrypt: (value: Buffer) => Promise.resolve({ value: Buffer.concat([Buffer.from('ENC:'), value]), version: 1 }),
		},
		query: prepareOtpMutation({}),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: {
					personId,
					password: '123',
					roles: [],
					email: 'john@doe.com',
				},
			}),
			{
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
				response: {
					rowCount: 1,
				},
			},
		],
		return: (response: any) => {
			expect(response.data.prepareOtp.ok).toEqual(true)
			expect(response.data.prepareOtp.result.otpUri).toMatch(/otpauth:.+/)
		},
	})
})

test('prepare otp does not disable an existing active secret (rollover)', async () => {
	const personId = testUuid(1)
	const activeUri = 'otpauth://totp/contember:john?secret=ABDEF&period=30&digits=6&algorithm=SHA1&issuer=contember'
	await executeTenantTest({
		providers: {
			encrypt: (value: Buffer) => Promise.resolve({ value: Buffer.concat([Buffer.from('ENC:'), value]), version: 1 }),
		},
		query: prepareOtpMutation({}),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: {
					personId,
					password: '123',
					roles: [],
					email: 'john@doe.com',
					// person already has an active TOTP factor
					otpUri: activeUri,
				},
			}),
			{
				// Only the pending slot is written; the active secret is never touched.
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
		// No auth log expected: the premature 2fa_disable on prepare was removed.
		return: (response: any) => {
			expect(response.data.prepareOtp.ok).toEqual(true)
		},
	})
})
