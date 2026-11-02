import { describe, test } from 'bun:test'
import { ExpectedQuery } from '@contember/database-tester'
import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { GQL, SQL } from '../../../src/tags.js'
import { addProjectMemberMutation } from './gql/addProjectMember.js'
import { updateProjectMemberMutation } from './gql/updateProjectMember.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getIdentityProjectMembershipPresenceSql } from './sql/getIdentityProjectMembershipPresenceSql.js'
import { identityKindSql } from './workloadIdentity/workloadIdentitySql.js'

// §6a: a trust identity is managed exclusively through applyWorkloadIdentityTrust.
const identityId = testUuid(6)
const projectId = testUuid(5)
const projectSlug = 'blog'
const project = { id: projectId, name: 'Blog', slug: projectSlug, config: {} }

const selectIdentitySql = (roles: string[]): ExpectedQuery => ({
	sql: SQL`SELECT "id", "description", "roles" FROM "tenant"."identity" WHERE "id" IN (?)`,
	parameters: [identityId],
	response: { rows: [{ id: identityId, description: null, roles }] },
})

describe('identity-targeted grant mutations refuse a workload identity', () => {
	test('addProjectMember', async () => {
		await executeTenantTest({
			query: addProjectMemberMutation({ projectSlug, identityId, memberships: [{ role: 'reviewer', variables: [] }] }),
			executes: [
				getProjectBySlugSql({ projectSlug, response: project }),
				identityKindSql(identityId, 'workload'),
			],
			return: { data: { addProjectMember: { ok: false, errors: [{ code: 'WORKLOAD_IDENTITY_MANAGED' }] } } },
		})
	})

	test('updateProjectMember', async () => {
		await executeTenantTest({
			query: updateProjectMemberMutation({ projectSlug, identityId, memberships: [{ role: 'editor', variables: [] }] }),
			executes: [
				getProjectBySlugSql({ projectSlug, response: project }),
				selectMembershipsSql({ identityId, projectId, membershipsResponse: [{ role: 'reviewer', variables: [] }] }),
				identityKindSql(identityId, 'workload'),
			],
			return: { data: { updateProjectMember: { ok: false, errors: [{ code: 'WORKLOAD_IDENTITY_MANAGED' }] } } },
		})
	})

	test('removeProjectMember', async () => {
		await executeTenantTest({
			query: GQL`mutation {
				removeProjectMember(projectSlug: "${projectSlug}", identityId: "${identityId}") {
					ok
					errors { code }
				}
			}`,
			executes: [
				getProjectBySlugSql({ projectSlug, response: project }),
				selectMembershipsSql({ identityId, projectId, membershipsResponse: [{ role: 'reviewer', variables: [] }] }),
				identityKindSql(identityId, 'workload'),
			],
			return: { data: { removeProjectMember: { ok: false, errors: [{ code: 'WORKLOAD_IDENTITY_MANAGED' }] } } },
		})
	})

	test('addGlobalIdentityRoles', async () => {
		await executeTenantTest({
			query: GQL`mutation {
				addGlobalIdentityRoles(identityId: "${identityId}", roles: ["entrypoint_deployer"]) {
					ok
					error { code }
				}
			}`,
			executes: [
				selectIdentitySql([]),
				getIdentityProjectMembershipPresenceSql(identityId),
				identityKindSql(identityId, 'workload'),
			],
			return: { data: { addGlobalIdentityRoles: { ok: false, error: { code: 'WORKLOAD_IDENTITY_MANAGED' } } } },
		})
	})

	test('removeGlobalIdentityRoles', async () => {
		await executeTenantTest({
			query: GQL`mutation {
				removeGlobalIdentityRoles(identityId: "${identityId}", roles: ["entrypoint_deployer"]) {
					ok
					error { code }
				}
			}`,
			executes: [
				selectIdentitySql(['entrypoint_deployer']),
				getIdentityProjectMembershipPresenceSql(identityId),
				identityKindSql(identityId, 'workload'),
			],
			return: { data: { removeGlobalIdentityRoles: { ok: false, error: { code: 'WORKLOAD_IDENTITY_MANAGED' } } } },
		})
	})
})
