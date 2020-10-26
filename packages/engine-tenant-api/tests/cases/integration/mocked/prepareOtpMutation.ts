import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { prepareOtpMutation } from './gql/prepareOtp'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('prepare otp', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
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
				sql: `update "tenant"."person" set "otp_uri" = ?, "otp_activated_at" = ? where "id" = ?`,
				parameters: [(url: string) => url.startsWith('otpauth:'), null, personId],
				response: {
					rowCount: 1,
				},
			},
		],
		return: (response: any) => {
			assert.ok(response.data.prepareOtp.ok)
			assert.match(response.data.prepareOtp.result.otpUri, /otpauth:.+/)
		},
	})
})

test.run()
