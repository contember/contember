import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { changeProfileMutation } from './gql/changeProfile.js'
import { updatePersonProfileNameAndEmailSql } from './sql/updatePesonNameSql.js'
import { authenticatedIdentityId } from '../../../src/testTenant.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'

test('changes my name and email', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const email = 'jane@doe.com'
	const name = 'Jane Doe'
	await executeTenantTest({
		query: changeProfileMutation({ personId, email, name }),
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456', identityId },
			}),
			getPersonByEmailSql({ email, response: null }),
			updatePersonProfileNameAndEmailSql({ personId, email, name }),
		],
		return: {
			data: {
				changeProfile: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change',
			response: expect.objectContaining({
				ok: true,
			}),
		}),
	})
})
