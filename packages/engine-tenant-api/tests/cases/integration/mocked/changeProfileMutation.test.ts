import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { expect, test } from 'bun:test'
import { changeProfileMutation } from './gql/changeProfile'
import { updatePersonProfileNameAndEmailSql } from './sql/updatePesonNameSql'
import { authenticatedIdentityId } from '../../../src/testTenant'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { getPersonByIdSql } from './sql/getPersonByIdSql'

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

