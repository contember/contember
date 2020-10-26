import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { confirmOtpMutation } from './gql/confirmOtp'
import { createOtp, generateOtp } from '../../../../src/model/utils/otp'
import { ConfirmOtpErrorCode } from '../../../../src/schema'
import { test } from 'uvu'

test('confirm otp mutation with valid code', async () => {
	const personId = testUuid(1)
	const otp = createOtp('foo', 'bar')
	await executeTenantTest({
		query: confirmOtpMutation({ token: generateOtp(otp) }),
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
	const otp = createOtp('foo', 'bar')
	await executeTenantTest({
		query: confirmOtpMutation({ token: '123456' }),
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
					ok: false,
					errors: [{ code: ConfirmOtpErrorCode.InvalidOtpToken }],
				},
			},
		},
	})
})

test.run()
