import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { listPersonsSql } from './sql/listPersonsSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'

test('persons query lists all persons (SUPER_ADMIN path, no filter)', async () => {
	const person1 = testUuid(1)
	const identity1 = testUuid(2)
	const person2 = testUuid(3)
	const identity2 = testUuid(4)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons {
		id
		email
		name
		emailOtpEnabled
		identity {
			id
		}
	}
}`,
			variables: {},
		},
		executes: [
			listPersonsSql({
				rows: [
					{ personId: person1, identityId: identity1, email: 'alice@example.com', name: 'Alice', emailOtpEnabled: true },
					{ personId: person2, identityId: identity2, email: 'bob@example.com', name: 'Bob' },
				],
			}),
		],
		return: {
			data: {
				persons: [
					{ id: person1, email: 'alice@example.com', name: 'Alice', emailOtpEnabled: true, identity: { id: identity1 } },
					{ id: person2, email: 'bob@example.com', name: 'Bob', emailOtpEnabled: false, identity: { id: identity2 } },
				],
			},
		},
	})
})

test('persons query with email filter', async () => {
	const person1 = testUuid(1)
	const identity1 = testUuid(2)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons(filter: { email: "alice" }) {
		id
		email
	}
}`,
			variables: {},
		},
		executes: [
			listPersonsSql({
				emailFilter: 'alice',
				rows: [
					{ personId: person1, identityId: identity1, email: 'alice@example.com', name: 'Alice' },
				],
			}),
		],
		return: {
			data: {
				persons: [
					{ id: person1, email: 'alice@example.com' },
				],
			},
		},
	})
})

// Regression test for CORR-1: the non-SUPER_ADMIN path must scope to exactly the
// members reachable via `project.members` — i.e. apply per-membership-role
// filtering. The caller below may view members in general and may view the
// `editor` role, but NOT the `admin` role; only the editor must appear.
test('persons (scoped, non-SUPER_ADMIN) lists only members whose role the caller may view', async () => {
	const projectId = testUuid(1)
	const identityAdmin = testUuid(20)
	const identityEditor = testUuid(21)
	const editorPerson = testUuid(22)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons {
		id
		email
		identity {
			id
		}
	}
}`,
			variables: {},
		},
		authorizator: {
			isAllowed: async (identity, scope, action) => {
				if (action.resource === 'person' && action.privilege === 'list') return false
				if (action.resource === 'project' && action.privilege === 'view') return false
				if (action.resource === 'project' && action.privilege === 'viewMembers') {
					const meta: Record<string, unknown> = action.meta ?? {}
					const memberships: unknown[] = Array.isArray(meta.memberships) ? meta.memberships : []
					// empty gate → visible; per-role → only `editor` is viewable
					return memberships.every(m => typeof m === 'object' && m !== null && 'role' in m && m.role === 'editor')
				}
				return false
			},
		},
		executes: [
			getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId }),
			...sqlTransaction(
				{
					// ProjectMembersQuery (filter {}) — every member identity of the project
					sql: SQL`select "id", "description" from "tenant"."identity"
						where exists (select ?::int from "tenant"."project_membership"
							where "project_membership"."identity_id" = "identity"."id" and "project_id" = ?)`,
					parameters: [1, projectId],
					response: {
						rows: [
							{ id: identityAdmin, description: 'admin' },
							{ id: identityEditor, description: 'editor' },
						],
					},
				},
				{
					// ProjectMembershipByIdentityQuery — the roles of those identities
					sql: SQL`with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id"
						from "tenant"."project_membership"
						where "identity_id" IN (?, ?) and "project_id" = ?),
						"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
							from "tenant"."project_membership_variable"
								inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
							group by "membership_id")
						select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId"
						from "memberships"
							left join "variables" on "memberships"."id" = "variables"."membership_id"`,
					parameters: [identityAdmin, identityEditor, projectId],
					response: {
						rows: [
							{ role: 'admin', variables: [], identityId: identityAdmin },
							{ role: 'editor', variables: [], identityId: identityEditor },
						],
					},
				},
			),
			// Only the editor identity survives per-role filtering → listing scoped to it
			listPersonsSql({
				identityIds: [identityEditor],
				rows: [{ personId: editorPerson, identityId: identityEditor, email: 'editor@example.com', name: 'Editor' }],
			}),
		],
		return: {
			data: {
				persons: [
					{ id: editorPerson, email: 'editor@example.com', identity: { id: identityEditor } },
				],
			},
		},
	})
})

test('persons (scoped) returns empty when the caller may not view members of any project', async () => {
	const projectId = testUuid(1)

	await executeTenantTest({
		query: {
			query: GQL`
query {
	persons {
		id
	}
}`,
			variables: {},
		},
		// Denies everything — including project:viewMembers, so the one project the
		// caller is a member of is skipped and no listing query is issued.
		authorizator: {
			isAllowed: async () => false,
		},
		executes: [
			getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId }),
		],
		return: {
			data: {
				persons: [],
			},
		},
	})
})
