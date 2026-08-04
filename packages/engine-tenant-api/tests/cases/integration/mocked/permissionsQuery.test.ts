import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { test } from 'bun:test'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'

const globalPermissionsQuery = GQL`query {
	me {
		permissions {
			canCreateProject
			canDeployEntrypoint
			canViewConfiguration
			canManageConfiguration
			canViewAuthLog
			canListPersons
			canListGlobalApiKeys
			canCreateGlobalApiKey
		}
	}
}`

const projectPermissionsQuery = GQL`query {
	projectBySlug(slug: "sandbox") {
		permissions {
			canViewMembers
			canAddMember
			canUpdateMember
			canRemoveMember
			canViewSecrets
			canSetSecret
			canCreateApiKey
			canUpdate
		}
	}
}`

test('me.permissions reports every tenant-wide capability', async () => {
	await executeTenantTest({
		query: globalPermissionsQuery,
		executes: [],
		return: {
			data: {
				me: {
					permissions: {
						canCreateProject: true,
						canDeployEntrypoint: true,
						canViewConfiguration: true,
						canManageConfiguration: true,
						canViewAuthLog: true,
						canListPersons: true,
						canListGlobalApiKeys: true,
						canCreateGlobalApiKey: true,
					},
				},
			},
		},
	})
})

test('me.permissions answers false for what the ACL denies', async () => {
	await executeTenantTest({
		query: globalPermissionsQuery,
		// Reading the config is allowed, writing it is not — the pair a read-only admin holds.
		authorizator: {
			isAllowed: async (identity, scope, action) => action.resource === 'system' && action.privilege === 'viewConfig',
		},
		executes: [],
		return: {
			data: {
				me: {
					permissions: {
						canCreateProject: false,
						canDeployEntrypoint: false,
						canViewConfiguration: true,
						canManageConfiguration: false,
						canViewAuthLog: false,
						canListPersons: false,
						canListGlobalApiKeys: false,
						canCreateGlobalApiKey: false,
					},
				},
			},
		},
	})
})

test('project.permissions reports every project-scoped capability', async () => {
	await executeTenantTest({
		query: projectPermissionsQuery,
		executes: [
			getProjectBySlugSql({
				projectSlug: 'sandbox',
				response: { id: testUuid(1), name: 'sandbox', slug: 'sandbox', config: {} },
			}),
		],
		return: {
			data: {
				projectBySlug: {
					permissions: {
						canViewMembers: true,
						canAddMember: true,
						canUpdateMember: true,
						canRemoveMember: true,
						canViewSecrets: true,
						canSetSecret: true,
						canCreateApiKey: true,
						canUpdate: true,
					},
				},
			},
		},
	})
})

test('project.permissions separates viewing secrets from setting them', async () => {
	await executeTenantTest({
		query: projectPermissionsQuery,
		// The real shape of a project admin: it may read which secrets exist but not write one,
		// which is exactly the case a UI cannot discover by asking the listing query.
		authorizator: {
			isAllowed: async (identity, scope, action) =>
				action.resource === 'project' && (action.privilege === 'view' || action.privilege === 'viewSecrets' || action.privilege === 'viewMembers'),
		},
		executes: [
			getProjectBySlugSql({
				projectSlug: 'sandbox',
				response: { id: testUuid(1), name: 'sandbox', slug: 'sandbox', config: {} },
			}),
		],
		return: {
			data: {
				projectBySlug: {
					permissions: {
						canViewMembers: true,
						canAddMember: false,
						canUpdateMember: false,
						canRemoveMember: false,
						canViewSecrets: true,
						canSetSecret: false,
						canCreateApiKey: false,
						canUpdate: false,
					},
				},
			},
		},
	})
})
