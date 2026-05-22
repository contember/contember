import { executeTenantTest, now } from '../../../src/testTenant'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { getAuthPoliciesSql } from './sql/authPolicySql'
import { expect, test } from 'bun:test'

test('createAuthPolicy (global) inserts a row and audits auth_policy_change', async () => {
	const policyId = testUuid(1)
	await executeTenantTest({
		query: {
			query: GQL`mutation($policy: AuthPolicyInput!) {
				createAuthPolicy(policy: $policy) { ok error { code } result { id } }
			}`,
			variables: { policy: { scope: 'global', roles: ['admin'], mfaRequired: true } },
		},
		executes: [
			{
				sql:
					SQL`insert into "tenant"."auth_policy" ("id", "scope", "project_id", "roles", "mfa_required", "token_expiration", "idle_timeout", "grace_duration", "remember_me_allowed", "created_at", "updated_at")
					values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				parameters: [policyId, 'global', null, ['admin'], true, null, null, null, null, now, now],
				response: { rowCount: 1 },
			},
		],
		return: (response: any) => {
			expect(response.data.createAuthPolicy.ok).toBe(true)
			expect(response.data.createAuthPolicy.result.id).toBe(policyId)
		},
		expectedAuthLog: expect.objectContaining({ type: 'auth_policy_change' }),
	})
})

test('createAuthPolicy (global) rejects a project reference', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($policy: AuthPolicyInput!) {
				createAuthPolicy(policy: $policy) { ok error { code } }
			}`,
			variables: { policy: { scope: 'global', project: 'foo', roles: ['admin'], mfaRequired: true } },
		},
		executes: [],
		return: (response: any) => {
			expect(response.data.createAuthPolicy.ok).toBe(false)
			expect(response.data.createAuthPolicy.error.code).toBe('PROJECT_NOT_ALLOWED')
		},
	})
})

test('authPolicies lists configured rows (project_id mapped to slug)', async () => {
	const projectId = testUuid(10)
	await executeTenantTest({
		query: {
			query: GQL`query {
				authPolicies { id scope project roles mfaRequired tokenExpiration }
			}`,
			variables: {},
		},
		executes: [
			getAuthPoliciesSql([
				{ id: testUuid(1), scope: 'global', roles: ['admin'], mfaRequired: true },
				{ id: testUuid(2), scope: 'project', projectId, roles: ['editor'], mfaRequired: true, tokenExpiration: '01:00:00' },
			]),
			{
				sql: SQL`select "id", "name", "slug", "config" from "tenant"."project" order by "slug" asc`,
				parameters: [],
				response: { rows: [{ id: projectId, name: 'Foo', slug: 'foo', config: {} }] },
			},
		],
		return: (response: any) => {
			const policies = response.data.authPolicies
			expect(policies).toHaveLength(2)
			expect(policies[0]).toMatchObject({ scope: 'global', project: null, mfaRequired: true })
			expect(policies[1]).toMatchObject({ scope: 'project', project: 'foo', tokenExpiration: 'PT1H' })
		},
	})
})

test('deleteAuthPolicy deletes a row and audits auth_policy_change', async () => {
	const policyId = testUuid(1)
	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				deleteAuthPolicy(id: $id) { ok error { code } }
			}`,
			variables: { id: policyId },
		},
		executes: [
			{
				sql: SQL`delete from "tenant"."auth_policy" where "id" = ?`,
				parameters: [policyId],
				response: { rowCount: 1 },
			},
		],
		return: { data: { deleteAuthPolicy: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'auth_policy_change' }),
	})
})

test('deleteAuthPolicy returns NOT_FOUND when nothing was removed', async () => {
	const policyId = testUuid(1)
	await executeTenantTest({
		query: {
			query: GQL`mutation($id: String!) {
				deleteAuthPolicy(id: $id) { ok error { code } }
			}`,
			variables: { id: policyId },
		},
		executes: [
			{
				sql: SQL`delete from "tenant"."auth_policy" where "id" = ?`,
				parameters: [policyId],
				response: { rowCount: 0 },
			},
		],
		return: { data: { deleteAuthPolicy: { ok: false, error: { code: 'NOT_FOUND' } } } },
	})
})
