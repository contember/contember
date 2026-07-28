import { executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'
import { listSessionsSql } from './sql/listSessionsSql.js'

test('get person by id query', async () => {
	const name = 'John Doe'
	const email = 'john@doe.com'
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`
query personById($id: String!) {
	personById(id: $id) {
		id
		name
		email
		identity {
			id
		}
	}
}`,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email, roles: [], password: '123', identityId, name },
			}),
		],
		return: {
			data: {
				personById: {
					id: personId,
					name,
					email,
					identity: {
						id: identityId,
					},
				},
			},
		},
	})
})

test('get person by id query reflects emailOtpEnabled', async () => {
	const email = 'otp@doe.com'
	const personId = testUuid(1)
	const identityId = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`
query personById($id: String!) {
	personById(id: $id) {
		id
		email
		emailOtpEnabled
	}
}`,
			variables: { id: personId },
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email, roles: [], password: '123', identityId, emailOtpEnabled: true },
			}),
		],
		return: {
			data: {
				personById: {
					id: personId,
					email,
					emailOtpEnabled: true,
				},
			},
		},
	})
})

test('person viewSessions permission does not require exposing identity roles', async () => {
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const sessionId = testUuid(3)

	await executeTenantTest({
		query: {
			query: GQL`
query personById($id: String!) {
	personById(id: $id) {
		identity {
			sessions { id }
		}
	}
}`,
			variables: { id: personId },
		},
		authorizator: {
			isAllowed: async (identity, scope, action) => action.resource === 'person' && (action.privilege === 'view' || action.privilege === 'viewSessions'),
		},
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email: 'person@example.com', roles: ['person'], password: '123', identityId },
			}),
			getIdentityByIdSql({ identityId, roles: ['person'] }),
			getIdentityProjectMembershipPresenceSql(identityId),
			listSessionsSql({
				identityId,
				now,
				rows: [{
					id: sessionId,
					created_at: now,
					expires_at: null,
					last_used_at: null,
					last_ip: null,
					last_user_agent: null,
					created_ip: null,
					created_user_agent: null,
					trust_forwarded_info: false,
				}],
			}),
		],
		return: {
			data: {
				personById: {
					identity: {
						sessions: [{ id: sessionId }],
					},
				},
			},
		},
	})
})
