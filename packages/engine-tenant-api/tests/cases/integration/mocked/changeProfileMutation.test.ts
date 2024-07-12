import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { test } from 'vitest'
import { changeProfileMutation } from './gql/changeProfile'
import { updatePersonProfileNameAndEmailSql } from './sql/updatePesonNameSql'
import { authenticatedIdentityId } from '../../../src/testTenantDb'
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
	})
})

