import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { updatePersonProfileEmailSql, updatePersonProfileNameAndEmailSql, updatePersonProfileNameSql } from './sql/updatePesonNameSql.js'
import { expect, test } from 'bun:test'
import { changeMyProfileMutation } from './gql/changeMyProfile.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { authenticatedApiKeyId, authenticatedIdentityId } from '../../../src/testTenant.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { SQL } from '../../../src/tags.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { reserveReauthenticationSql } from './sql/reserveReauthenticationSql.js'

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

const reauthenticationConfig = getConfigSql({ email_change_require_reauthentication: true })

test('changes my email - re-authentication required by config and missing', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: changeMyProfileMutation({ email: 'jane@doe.com' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			reauthenticationConfig,
		],
		return: { data: { changeMyProfile: { ok: false, error: { code: 'REAUTHENTICATION_REQUIRED' } } } },
		expectedAuthLog: expect.objectContaining({ type: 'email_change', response: expect.objectContaining({ ok: false }) }),
	})
})

test('changes my email - re-authentication with a wrong password', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: changeMyProfileMutation({ email: 'jane@doe.com', currentPassword: 'wrong' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			reauthenticationConfig,
			...reserveReauthenticationSql({ personId }),
		],
		return: { data: { changeMyProfile: { ok: false, error: { code: 'INVALID_PASSWORD' } } } },
		expectedAuthLog: expect.objectContaining({ type: 'email_change', response: expect.objectContaining({ ok: false }) }),
	})
})

test('changes my email - re-authentication is refused after too many attempts, even with the right password', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: changeMyProfileMutation({ email: 'jane@doe.com', currentPassword: '123456' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			reauthenticationConfig,
			...reserveReauthenticationSql({ personId, attempts: 6 }),
		],
		return: { data: { changeMyProfile: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED' } } } },
		expectedAuthLog: expect.objectContaining({ type: 'email_change', response: expect.objectContaining({ ok: false }) }),
	})
})

test('changes my email - re-authenticated change signs out other sessions and notifies the old address', async () => {
	const personId = testUuid(1)
	const email = 'jane@doe.com'
	await executeTenantTest({
		query: changeMyProfileMutation({ email, currentPassword: '123456' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			reauthenticationConfig,
			...reserveReauthenticationSql({ personId }),
			...sqlTransaction(
				getPersonByEmailSql({ email, response: null }),
				updatePersonProfileEmailSql({ personId, email }),
				{
					sql: SQL`update "tenant"."api_key" set "disabled_at" = now()
						where "identity_id" in (select "identity_id" from "tenant"."person" where "id" = ?)
						and "type" = ? and "disabled_at" is null and "id" != ?`,
					parameters: [personId, 'session', authenticatedApiKeyId],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`update "tenant"."person_token" set "used_at" = now() where "person_id" = ? and "used_at" is null`,
					parameters: [personId],
					response: { rowCount: 0 },
				},
			),
			getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId: testUuid(10) }),
			getMailTemplateSql({ type: 'emailChangeNotify', projectId: testUuid(10) }),
			getMailTemplateSql({ type: 'emailChangeNotify', projectId: null }),
		],
		sentMails: [{ subject: 'Your e-mail address was changed' }],
		return: { data: { changeMyProfile: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'email_change', response: expect.objectContaining({ ok: true }) }),
	})
})

test('refuses a new address with whitespace inside', async () => {
	await executeTenantTest({
		query: changeMyProfileMutation({ email: 'big jane@doe.com' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId: testUuid(1), email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			getConfigSql(),
		],
		return: { data: { changeMyProfile: { ok: false, error: { code: 'INVALID_EMAIL_FORMAT' } } } },
	})
})
