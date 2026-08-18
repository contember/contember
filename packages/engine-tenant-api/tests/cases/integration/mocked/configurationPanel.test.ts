import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { expect, test } from 'bun:test'

test('configuration exposes the panel access lists', async () => {
	await executeTenantTest({
		query: GQL`query {
			configuration { panel { globalRoles projectRoles } }
		}`,
		executes: [
			getConfigSql({ panel_global_roles: ['super_admin', 'ops'], panel_project_roles: [] }),
		],
		return: {
			data: {
				configuration: {
					panel: {
						globalRoles: ['super_admin', 'ops'],
						projectRoles: [],
					},
				},
			},
		},
	})
})

test('configuration returns the panel defaults', async () => {
	await executeTenantTest({
		query: GQL`query {
			configuration { panel { globalRoles projectRoles } }
		}`,
		executes: [getConfigSql()],
		return: {
			data: {
				configuration: {
					panel: {
						globalRoles: ['super_admin', 'project_admin'],
						projectRoles: ['admin'],
					},
				},
			},
		},
	})
})

test('configure writes both panel role lists', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($config: ConfigInput!) {
				configure(config: $config) { ok error { code } }
			}`,
			variables: { config: { panel: { globalRoles: ['super_admin', 'ops'], projectRoles: ['admin', 'editor'] } } },
		},
		executes: [
			{
				sql: SQL`update "tenant"."config" set "panel_global_roles" = ?, "panel_project_roles" = ? where "id" = ?`,
				parameters: [['super_admin', 'ops'], ['admin', 'editor'], 'singleton'],
				response: { rowCount: 1 },
			},
		],
		return: { data: { configure: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'tenant_config_change' }),
	})
})

test('configure writes an empty panel list (closes the panel)', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($config: ConfigInput!) {
				configure(config: $config) { ok error { code } }
			}`,
			variables: { config: { panel: { globalRoles: [] } } },
		},
		executes: [
			{
				sql: SQL`update "tenant"."config" set "panel_global_roles" = ? where "id" = ?`,
				parameters: [[], 'singleton'],
				response: { rowCount: 1 },
			},
		],
		return: { data: { configure: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'tenant_config_change' }),
	})
})

// An omitted section must not touch the panel columns — the update is a partial merge.
test('configure without a panel section leaves the columns alone', async () => {
	await executeTenantTest({
		query: {
			query: GQL`mutation($config: ConfigInput!) {
				configure(config: $config) { ok error { code } }
			}`,
			variables: { config: { password: { minLength: 12 } } },
		},
		executes: [
			{
				sql: SQL`update "tenant"."config" set "password_min_length" = ? where "id" = ?`,
				parameters: [12, 'singleton'],
				response: { rowCount: 1 },
			},
		],
		return: { data: { configure: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'tenant_config_change' }),
	})
})
