import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { updatePersonProfileEmailSql, updatePersonProfileNameAndEmailSql, updatePersonProfileNameSql } from './sql/updatePesonNameSql.js'
import { expect, test } from 'bun:test'
import { changeMyProfileMutation } from './gql/changeMyProfile.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { authenticatedIdentityId } from '../../../src/testTenant.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getConfigSql } from './sql/getConfigSql.js'

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
			getConfigSql(),
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
			getConfigSql(),
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
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
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
		expectedAuthLog: expect.objectContaining({
			type: 'email_change',
			response: expect.objectContaining({
				ok: true,
			}),
		}),
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

test('changes my email - invalid #2', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const email = 'foobar'
	await executeTenantTest({
		query: changeMyProfileMutation({ email }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			getConfigSql(),
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
		expectedAuthLog: expect.objectContaining({
			type: 'email_change',
			response: expect.objectContaining({
				ok: false,
			}),
		}),
	})
})

test('changes my email - exists', async () => {
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
			getConfigSql(),
			getPersonByEmailSql({ email, response: { personId: testUuid(4), identityId: testUuid(5), roles: [], password: '' } }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: false,
					error: {
						code: 'EMAIL_ALREADY_EXISTS',
					},
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change',
			response: expect.objectContaining({
				ok: false,
			}),
		}),
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
			getConfigSql(),
			getPersonByEmailSql({ email, response: null }),
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
		expectedAuthLog: expect.objectContaining({
			type: 'email_change',
			response: expect.objectContaining({
				ok: true,
			}),
		}),
	})
})
