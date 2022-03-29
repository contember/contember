import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { confirmOtpMutation } from './gql/confirmOtp'
import { ConfirmOtpErrorCode } from '../../../../src/schema'
import { test } from 'vitest'
import { OtpAuthenticator } from '../../../../src'
import { Buffer } from 'buffer'

test('confirm otp mutation with valid code', async () => {
	const personId = testUuid(1)
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')
	await executeTenantTest({
		query: confirmOtpMutation({ token: otpAuth.generate(otp) }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: {
					personId,
					password: '123',
					otpUri: otp.uri,
					roles: [],
					email: 'john@doe.com',
				},
			}),
			{
				sql: `update "tenant"."person" set "otp_activated_at" = ? where "id" = ?`,
				parameters: [now, personId],
				response: {
					rowCount: 1,
				},
			},
		],
		return: {
			data: {
				confirmOtp: {
					ok: true,
					errors: [],
				},
			},
		},
	})
})

test('confirm otp mutation with invalid code', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: confirmOtpMutation({ token: '123456' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: {
					personId,
					password: '123',
					otpUri: 'otpauth://totp/contember:john?secret=ABDEF&period=30&digits=6&algorithm=SHA1&issuer=contember',
					roles: [],
					email: 'john@doe.com',
				},
			}),
			{
				sql: `update "tenant"."person" set "otp_activated_at" = ? where "id" = ?`,
				parameters: [now, personId],
				response: {
					rowCount: 1,
				},
			},
		],
		return: {
			data: {
				confirmOtp: {
					ok: false,
					errors: [{ code: ConfirmOtpErrorCode.InvalidOtpToken }],
				},
			},
		},
	})
})

