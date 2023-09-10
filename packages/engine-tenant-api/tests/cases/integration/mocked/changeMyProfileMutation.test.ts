import { executeTenantTest } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { updatePersonProfileNameSql, updatePersonProfileEmailSql, updatePersonProfileNameAndEmailSql } from './sql/updatePesonNameSql'
import { test } from 'vitest'
import { changeMyProfileMutation } from './gql/changeMyProfile'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { authenticatedIdentityId } from '../../../src/testTenantDb'

test('changes my name', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const name = 'Jane Doe'
	await executeTenantTest({
		query: changeMyProfileMutation({ name }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			updatePersonProfileNameSql({ personId, name }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: true,
					error: null,
				},
			},
		},
	})
})


test('unset my name', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const name = null
	await executeTenantTest({
		query: changeMyProfileMutation({ name }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			updatePersonProfileNameSql({ personId, name }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: true,
					error: null,
				},
			},
		},
	})
})

test('changes my email', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const email = 'jane@doe.com'
	await executeTenantTest({
		query: changeMyProfileMutation({ email }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			updatePersonProfileEmailSql({ personId, email }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: true,
					error: null,
				},
			},
		},
	})
})

test('changes my email - invalid', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const email = null
	await executeTenantTest({
		query: changeMyProfileMutation({ email }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			updatePersonProfileEmailSql({ personId, email }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: false,
					error: {
						code: 'INVALID_EMAIL_FORMAT',
					},
				},
			},
		},
	})
})

test('changes my name and email', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const email = 'jane@doe.com'
	const name = 'Jane Doe'
	await executeTenantTest({
		query: changeMyProfileMutation({ email, name }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			updatePersonProfileNameAndEmailSql({ personId, email, name }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: true,
					error: null,
				},
			},
		},
	})
})
