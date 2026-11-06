import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { executeTenantTest } from '../../../src/testTenant.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getPersonsByIdentitySql } from './sql/getPersonsByIdentitySql.js'
import { test } from 'bun:test'
import { Authorizator } from '@contember/authorization'
import { Identity } from '../../../../src/model/authorization/Identity.js'

test('removes a project member', async () => {
	const identityId = testUuid(6)
	const projectId = testUuid(5)
	const personId = testUuid(7)
	const role = 'editor'
	const beforeMemberships = [{ role, variables: [] }]
	await executeTenantTest({
		query: GQL`mutation {
          removeProjectMember(projectSlug: "blog", identityId: "${identityId}") {
            ok
	          errors {
		          code
	          }
          }
        }`,
		executes: [
			getProjectBySlugSql({ projectSlug: 'blog', response: { id: projectId, name: 'Blog', slug: 'blog', config: {} } }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: beforeMemberships,
			}),
			...sqlTransaction({
				sql: SQL`DELETE
						         FROM "tenant"."project_membership"
						         WHERE "project_id" = ? AND "identity_id" = ?`,
				parameters: [projectId, identityId],
				response: {
					rowCount: 1,
				},
			}),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [],
			}),
			getPersonsByIdentitySql({
				identityIds: [identityId],
				response: [{ personId, identityId, email: 'john@doe.com' }],
			}),
		],
		return: {
			data: {
				removeProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
		expectedAuthLog: {
			type: 'project_membership_remove',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				projectId,
				identityId,
				before: beforeMemberships,
				after: [],
			},
		},
	})
})

/** A member manager that may view, update and remove `editor` memberships only. */
const editorOnlyManager: Authorizator<Identity> = {
	isAllowed: (_identity, _scope, action) => {
		const meta = action.meta
		if (action.resource !== 'project' || meta === undefined || !('memberships' in meta) || !Array.isArray(meta.memberships)) {
			return Promise.resolve(false)
		}
		return Promise.resolve(meta.memberships.every((it: { role: string }) => it.role === 'editor'))
	},
}

test('a manager limited to one role removes only that membership', async () => {
	const identityId = testUuid(6)
	const projectId = testUuid(5)
	const personId = testUuid(7)
	const beforeMemberships = [{ role: 'editor', variables: [] }, { role: 'admin', variables: [] }]
	await executeTenantTest({
		query: GQL`mutation {
          removeProjectMember(projectSlug: "blog", identityId: "${identityId}") {
            ok
	          errors {
		          code
	          }
          }
        }`,
		authorizator: editorOnlyManager,
		executes: [
			getProjectBySlugSql({ projectSlug: 'blog', response: { id: projectId, name: 'Blog', slug: 'blog', config: {} } }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: beforeMemberships,
			}),
			...sqlTransaction({
				sql: SQL`DELETE
						         FROM "tenant"."project_membership"
						         WHERE "project_id" = ? AND "identity_id" = ? AND "role" in (?)`,
				parameters: [projectId, identityId, 'editor'],
				response: {
					rowCount: 1,
				},
			}),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role: 'admin', variables: [] }],
			}),
			getPersonsByIdentitySql({
				identityIds: [identityId],
				response: [{ personId, identityId, email: 'john@doe.com' }],
			}),
		],
		return: {
			data: {
				removeProjectMember: {
					ok: true,
					errors: [],
				},
			},
		},
		expectedAuthLog: {
			type: 'project_membership_remove',
			response: { ok: true, result: null },
			targetPersonId: personId,
			eventData: {
				projectId,
				identityId,
				before: beforeMemberships,
				after: [{ role: 'admin', variables: [] }],
			},
		},
	})
})

test('a manager limited to one role cannot remove a member holding only other roles', async () => {
	const identityId = testUuid(6)
	const projectId = testUuid(5)
	await executeTenantTest({
		query: GQL`mutation {
          removeProjectMember(projectSlug: "blog", identityId: "${identityId}") {
            ok
          }
        }`,
		authorizator: editorOnlyManager,
		executes: [
			getProjectBySlugSql({ projectSlug: 'blog', response: { id: projectId, name: 'Blog', slug: 'blog', config: {} } }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role: 'admin', variables: [] }],
			}),
		],
		return: {
			errors: [{ message: 'You are not allowed to remove a project member' }],
			data: { removeProjectMember: null },
		},
	})
})
