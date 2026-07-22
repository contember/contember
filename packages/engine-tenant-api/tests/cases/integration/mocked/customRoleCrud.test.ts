import { executeTenantTest, now } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'

const customRoleRow = (slug: string, permissions: string[], description: string | null = null) => ({
	id: testUuid(50),
	slug,
	description,
	permissions,
	created_at: now,
	updated_at: now,
})

test('createCustomRole inserts a row and audits custom_role_change', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'support', permissions: ['person:forceSignOut', 'person:resetMfa'] },
		},
		executes: [
			{
				sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`,
				parameters: ['support'],
				response: { rows: [] },
			},
			{
				sql: SQL`insert into "tenant"."custom_role" ("id", "slug", "description", "permissions", "created_at", "updated_at")
					values (?, ?, ?, ?, ?, ?)`,
				parameters: [testUuid(1), 'support', null, ['person:forceSignOut', 'person:resetMfa'], now, now],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: { createCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: expect.objectContaining({ type: 'custom_role_change' }),
	})
})

test('createCustomRole rejects an unknown permission', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code developerMessage } }
			}`,
			variables: { slug: 'support', permissions: ['person:doesNotExist'] },
		},
		executes: [],
		return: (response: any) => {
			expect(response.data.createCustomRole.ok).toBe(false)
			expect(response.data.createCustomRole.error.code).toBe('UNKNOWN_PERMISSION')
		},
	})
})

test('createCustomRole rejects an escalation-vector permission', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'support', permissions: ['identity:addGlobalRoles'] },
		},
		executes: [],
		return: (response: any) => {
			expect(response.data.createCustomRole.ok).toBe(false)
			expect(response.data.createCustomRole.error.code).toBe('UNKNOWN_PERMISSION')
		},
	})
})

test('createCustomRole rejects a builtin role slug', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'super_admin', permissions: ['person:list'] },
		},
		executes: [],
		return: (response: any) => {
			expect(response.data.createCustomRole.ok).toBe(false)
			expect(response.data.createCustomRole.error.code).toBe('INVALID_SLUG')
		},
	})
})

test('createCustomRole rejects a malformed slug', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'Support Team', permissions: ['person:list'] },
		},
		executes: [],
		return: (response: any) => {
			expect(response.data.createCustomRole.ok).toBe(false)
			expect(response.data.createCustomRole.error.code).toBe('INVALID_SLUG')
		},
	})
})

test('createCustomRole reports an existing slug', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]!) {
				createCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'support', permissions: ['person:list'] },
		},
		executes: [
			{
				sql: SQL`select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`,
				parameters: ['support'],
				response: { rows: [customRoleRow('support', ['person:list'])] },
			},
		],
		return: (response: any) => {
			expect(response.data.createCustomRole.ok).toBe(false)
			expect(response.data.createCustomRole.error.code).toBe('SLUG_ALREADY_EXISTS')
		},
	})
})

test('updateCustomRole updates permissions and audits custom_role_change', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]) {
				updateCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'support', permissions: ['person:forceSignOut'] },
		},
		executes: [
			{
				sql: SQL`update "tenant"."custom_role" set "permissions" = ?, "updated_at" = ? where "slug" = ?`,
				parameters: [['person:forceSignOut'], now, 'support'],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: { updateCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: expect.objectContaining({ type: 'custom_role_change' }),
	})
})

test('updateCustomRole reports a missing role', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!, $permissions: [String!]) {
				updateCustomRole(slug: $slug, permissions: $permissions) { ok error { code } }
			}`,
			variables: { slug: 'ghost', permissions: ['person:forceSignOut'] },
		},
		executes: [
			{
				sql: SQL`update "tenant"."custom_role" set "permissions" = ?, "updated_at" = ? where "slug" = ?`,
				parameters: [['person:forceSignOut'], now, 'ghost'],
				response: { rowCount: 0 },
			},
		],
		return: (response: any) => {
			expect(response.data.updateCustomRole.ok).toBe(false)
			expect(response.data.updateCustomRole.error.code).toBe('NOT_FOUND')
		},
	})
})

test('deleteCustomRole deletes a row and audits custom_role_change', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($slug: String!) {
				deleteCustomRole(slug: $slug) { ok error { code } }
			}`,
			variables: { slug: 'support' },
		},
		executes: [
			{
				sql: SQL`delete from "tenant"."custom_role" where "slug" = ?`,
				parameters: ['support'],
				response: { rowCount: 1 },
			},
		],
		return: {
			data: { deleteCustomRole: { ok: true, error: null } },
		},
		expectedAuthLog: expect.objectContaining({ type: 'custom_role_change' }),
	})
})

test('customRoles lists rows, customRolePermissions lists the catalog', async () => {
	await executeTenantTest({
		query: {
			query: GQL`query {
				customRoles { slug description permissions }
				customRolePermissions
			}`,
			variables: {},
		},
		executes: [
			{
				sql: SQL`select *  from "tenant"."custom_role" order by "slug" asc`,
				parameters: [],
				response: { rows: [customRoleRow('support', ['person:forceSignOut'], 'Support team')] },
			},
		],
		return: (response: any) => {
			expect(response.data.customRoles).toEqual([
				{ slug: 'support', description: 'Support team', permissions: ['person:forceSignOut'] },
			])
			expect(response.data.customRolePermissions).toContain('person:forceSignOut')
			expect(response.data.customRolePermissions).not.toContain('identity:addGlobalRoles')
		},
	})
})
