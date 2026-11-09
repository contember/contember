import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'
import { listSessionsSql } from './sql/listSessionsSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { Authorizator } from '@contember/authorization'
import { Identity } from '../../../../src/model/authorization/Identity.js'

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
			isAllowed: async (identity, scope, action) =>
				action.resource === 'person' && (action.privilege === 'view' || action.privilege === 'list' || action.privilege === 'viewSessions'),
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

/** May view persons and the `editor` members of its projects, but not list every person. */
const editorMemberViewer: Authorizator<Identity> = {
	isAllowed: async (identity, scope, action) => {
		if (action.resource === 'person') {
			return action.privilege === 'view'
		}
		if (action.resource === 'project' && action.privilege === 'viewMembers') {
			const meta: Record<string, unknown> = action.meta ?? {}
			const memberships: unknown[] = Array.isArray(meta.memberships) ? meta.memberships : []
			return memberships.every(m => typeof m === 'object' && m !== null && 'role' in m && m.role === 'editor')
		}
		return false
	},
}

const personByIdQuery = (id: string) => ({
	query: GQL`
query personById($id: String!) {
	personById(id: $id) {
		id
	}
}`,
	variables: { id },
})

const visibleMemberSql = (args: { projectId: string; identityId: string; role: string }) =>
	sqlTransaction(
		{
			sql: SQL`select "id", "description" from "tenant"."identity"
				where exists (select ?::int from "tenant"."project_membership"
					where "project_membership"."identity_id" = "identity"."id" and "project_id" = ?)
					and "identity"."id" in (?)
				order by "identity"."id" asc`,
			parameters: [1, args.projectId, args.identityId],
			response: { rows: [{ id: args.identityId, description: null }] },
		},
		{
			sql: SQL`with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id"
				from "tenant"."project_membership"
				where "identity_id" IN (?) and "project_id" = ?),
				"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
					from "tenant"."project_membership_variable"
						inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
					group by "membership_id")
				select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId"
				from "memberships"
					left join "variables" on "memberships"."id" = "variables"."membership_id"`,
			parameters: [args.identityId, args.projectId],
			response: { rows: [{ role: args.role, variables: [], identityId: args.identityId }] },
		},
	)

test('personById does not return a person outside the members the caller may see', async () => {
	const projectId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)

	await executeTenantTest({
		query: personByIdQuery(personId),
		authorizator: editorMemberViewer,
		executes: [
			getPersonByIdSql({ personId, response: { personId, email: 'admin@example.com', roles: [], password: '123', identityId } }),
			getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId }),
			...visibleMemberSql({ projectId, identityId, role: 'admin' }),
		],
		return: { data: { personById: null } },
	})
})

test('personById returns a member the caller may see', async () => {
	const projectId = testUuid(1)
	const personId = testUuid(2)
	const identityId = testUuid(3)

	await executeTenantTest({
		query: personByIdQuery(personId),
		authorizator: editorMemberViewer,
		executes: [
			getPersonByIdSql({ personId, response: { personId, email: 'editor@example.com', roles: [], password: '123', identityId } }),
			getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId }),
			...visibleMemberSql({ projectId, identityId, role: 'editor' }),
		],
		return: { data: { personById: { id: personId } } },
	})
})

test('personById returns the caller itself without a membership lookup', async () => {
	const personId = testUuid(2)

	await executeTenantTest({
		query: personByIdQuery(personId),
		authorizator: editorMemberViewer,
		executes: [
			getPersonByIdSql({
				personId,
				response: { personId, email: 'me@example.com', roles: [], password: '123', identityId: authenticatedIdentityId },
			}),
		],
		return: { data: { personById: { id: personId } } },
	})
})
