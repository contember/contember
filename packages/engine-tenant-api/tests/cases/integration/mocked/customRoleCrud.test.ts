import { expect, test } from 'bun:test'
import { executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { sqlReadCommittedTransaction } from './sql/sqlTransaction.js'

const listGrantInput = [{ permission: 'person:list' }]
const listGrant = [{ permission: 'person:list', config: null }]

const customRoleRow = (
	slug: string,
	grants: readonly object[],
	description: string | null = null,
) => ({
	id: testUuid(50),
	slug,
	description,
	grants,
	created_at: now,
	updated_at: now,
})

test('createCustomRole stores canonical grants and audits the full role state', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]!) {
				createCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: { slug: 'support', grants: listGrantInput },
		},
		executes: [
			...sqlReadCommittedTransaction(
				{
					sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`,
					parameters: ['support'],
					response: { rows: [] },
				},
				{
					sql: SQL`insert into  "tenant"."custom_role" ("id", "slug", "description", "grants", "created_at", "updated_at")
						values  (?, ?, ?, ?, ?, ?)`,
					parameters: [testUuid(1), 'support', null, JSON.stringify(listGrant), now, now],
					response: { rowCount: 1 },
				},
			),
		],
		return: {
			data: { createCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: {
			type: 'custom_role_change',
			response: { ok: true, result: null },
			eventData: {
				operation: 'create',
				after: { slug: 'support', description: null, grants: listGrant },
			},
		},
	})
})

test('createCustomRole rejects invalid and duplicate grant definitions', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]!) {
				createCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: {
				slug: 'support',
				grants: [{ permission: 'person:list' }, { permission: 'person:list' }],
			},
		},
		executes: [...sqlReadCommittedTransaction()],
		return: {
			data: {
				createCustomRole: {
					ok: false,
					error: { code: 'DUPLICATE_PERMISSION' },
				},
			},
		},
	})

	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]!) {
				createCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: {
				slug: 'support',
				grants: [{ permission: 'identity:addGlobalRoles' }],
			},
		},
		executes: [...sqlReadCommittedTransaction()],
		return: {
			data: {
				createCustomRole: {
					ok: false,
					error: { code: 'INVALID_PERMISSION_CONFIGURATION' },
				},
			},
		},
	})
})

test('createCustomRole rejects nonexistent role references', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]!) {
				createCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: {
				slug: 'support',
				grants: [{
					permission: 'person:signUp',
					config: { roles: { allowed: ['ghost'] } },
				}],
			},
		},
		executes: [
			...sqlReadCommittedTransaction({
				sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for share`,
				parameters: ['ghost'],
				response: { rows: [] },
			}),
		],
		return: {
			data: {
				createCustomRole: {
					ok: false,
					error: { code: 'INVALID_PERMISSION_CONFIGURATION' },
				},
			},
		},
	})
})

test('createCustomRole rejects a slug that is already taken', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]!) {
				createCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: { slug: 'support', grants: listGrantInput },
		},
		executes: [
			...sqlReadCommittedTransaction({
				sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`,
				parameters: ['support'],
				response: { rows: [customRoleRow('support', listGrant)] },
			}),
		],
		return: {
			data: {
				createCustomRole: {
					ok: false,
					error: { code: 'SLUG_ALREADY_EXISTS' },
				},
			},
		},
	})
})

test('updateCustomRole stores canonical grants and audits before and after state', async () => {
	const forceSignOutGrant = [{
		permission: 'person:forceSignOut',
		config: {
			target: {
				globalRoles: { allowed: ['person'] },
				projectMemberships: 'none',
			},
		},
	}]
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]) {
				updateCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: { slug: 'support', grants: forceSignOutGrant },
		},
		executes: [
			...sqlReadCommittedTransaction(
				{
					sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for update`,
					parameters: ['support'],
					response: { rows: [customRoleRow('support', listGrant, 'Support team')] },
				},
				{
					sql: SQL`update "tenant"."custom_role" set "grants" = ?, "updated_at" = ? where "slug" = ?`,
					parameters: [JSON.stringify(forceSignOutGrant), now, 'support'],
					response: { rowCount: 1 },
				},
			),
		],
		return: {
			data: { updateCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: {
			type: 'custom_role_change',
			response: { ok: true, result: null },
			eventData: {
				operation: 'update',
				before: { slug: 'support', description: 'Support team', grants: listGrant },
				after: { slug: 'support', description: 'Support team', grants: forceSignOutGrant },
			},
		},
	})
})

test('updateCustomRole rejects an explicit null grants value', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $grants: [CustomRoleGrantInput!]) {
				updateCustomRole(slug: $slug, grants: $grants) { ok error { code } }
			}`,
			variables: { slug: 'support', grants: null },
		},
		executes: [
			...sqlReadCommittedTransaction({
				sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for update`,
				parameters: ['support'],
				response: { rows: [customRoleRow('support', listGrant)] },
			}),
		],
		return: {
			data: {
				updateCustomRole: {
					ok: false,
					error: { code: 'INVALID_PERMISSION_CONFIGURATION' },
				},
			},
		},
	})
})

test('deleteCustomRole removes the role and every stale assignment atomically', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!) {
				deleteCustomRole(slug: $slug) { ok error { code } }
			}`,
			variables: { slug: 'support' },
		},
		executes: [
			...sqlReadCommittedTransaction(
				{
					sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc for update`,
					parameters: ['support'],
					response: { rows: [customRoleRow('support', listGrant, 'Support team')] },
				},
				{
					sql: SQL`delete from  "tenant"."custom_role"  where "slug" = ?`,
					parameters: ['support'],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`update  "tenant"."identity" set  "roles" =  roles - ?  where roles \\? ?`,
					parameters: ['support', 'support'],
					response: { rowCount: 2 },
				},
			),
		],
		return: {
			data: { deleteCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: {
			type: 'custom_role_change',
			response: { ok: true, result: null },
			eventData: {
				operation: 'delete',
				before: { slug: 'support', description: 'Support team', grants: listGrant },
				removedAssignments: 2,
			},
		},
	})
})

test('customRoles returns full grants and the catalog describes configuration requirements', async () => {
	await executeTenantTest({
		query: {
			query: GQL`query {
				customRoles { slug description grants { permission config } }
				customRolePermissions { name configurationKind configurationRequired defaultConfig }
			}`,
			variables: {},
		},
		executes: [
			{
				sql: SQL`select *  from "tenant"."custom_role" order by "slug" asc`,
				parameters: [],
				response: { rows: [customRoleRow('support', listGrant, 'Support team')] },
			},
		],
		return: (response: object) => {
			expect(response).toHaveProperty('data.customRoles', [
				{ slug: 'support', description: 'Support team', grants: listGrant },
			])
			expect(response).toHaveProperty('data.customRolePermissions')
			const serialized = JSON.stringify(response)
			expect(serialized).toContain('"name":"identity:addGlobalRoles"')
			expect(serialized).toContain('"configurationKind":"ROLE_MUTATION"')
			expect(serialized).not.toContain('"name":"project:addMember"')
		},
	})
})

test('customRoles reports a persisted-invalid role as inert', async () => {
	await executeTenantTest({
		query: GQL`query {
			customRoles { slug grants { permission config } }
		}`,
		executes: [{
			sql: SQL`select *  from "tenant"."custom_role" order by "slug" asc`,
			parameters: [],
			response: {
				rows: [customRoleRow('support', [
					...listGrant,
					{ permission: 'person:changePassword', config: { target: 'invalid' } },
				])],
			},
		}],
		return: {
			data: {
				customRoles: [{ slug: 'support', grants: [] }],
			},
		},
	})
})

// `customRole:manage` is the single rail stopping a delegated principal from writing its own
// permission bundle. These run through the REAL authorization stack (`identityRoles`), so
// dropping any of the three `requireAccess` calls in CustomRoleMutationResolver turns them red.
test.each([
	[
		'createCustomRole',
		GQL`mutation { createCustomRole(slug: "escalated", grants: [{ permission: "person:list" }]) { ok } }`,
	],
	[
		'updateCustomRole',
		GQL`mutation { updateCustomRole(slug: "support", grants: [{ permission: "person:list" }]) { ok } }`,
	],
	['deleteCustomRole', GQL`mutation { deleteCustomRole(slug: "support") { ok } }`],
])('%s is refused to project_admin and touches no data', async (field, query) => {
	await executeTenantTest({
		identityRoles: ['project_admin'],
		query,
		// project_admin is builtin-only, so the request-scoped custom_role preload is skipped too
		executes: [],
		return: {
			data: { [field]: null },
			errors: [{ message: 'You are not allowed to manage custom roles' }],
		},
	})
})
