import 'jasmine'
import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { prepareOtpMutation } from './gql/prepareOtp'
import { getPersonByIdentity } from './sql/getPersonByIdentity'

describe('prepare otp mutation', () => {
	it('prepare otp', async () => {
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
					parameters: [jasmine.stringMatching(/otpauth:\/\/.+/g), null, personId],
					response: {
						rowCount: 1,
					},
				},
			],
			return: {
				data: {
					prepareOtp: {
						ok: true,
						result: {
							otpUri: jasmine.stringMatching(/otpauth:\/\/.+/g),
						},
					},
				},
			},
		})
	})
})
