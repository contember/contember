import { test, assert } from 'vitest'
import { MembershipAwareAccessNode } from '../../../../src/model/authorization/MembershipAwareAccessNode.js'
import { testUuid } from '@contember/engine-api-tester'
import { PermissionActions } from '../../../../src/index.js'
import { Acl } from '@contember/schema'

const siteIdA = testUuid(666)
const siteIdB = testUuid(667)
const aclSchemaAdminCanManageEditorWithMatchingVariables: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				manage: {
					editor: {
						variables: { site: 'site' },
					},
				},
			},
		},
	},
}
const adminOfSiteA = [
	{ role: 'admin', variables: [{ name: 'site', values: [siteIdA] }] },
]
const editorOfSiteA = [
	{ role: 'editor', variables: [{ name: 'site', values: [siteIdA] }] },
]
const editorOfSiteB = [
	{ role: 'editor', variables: [{ name: 'site', values: [siteIdB] }] },
]
const aclEvaluator = { evaluate: () => Promise.reject() }

test('admin can assign editor role with matching variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorWithMatchingVariables)

	assert.ok(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteA)))
})

test('admin cannot assign editor role with different variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorWithMatchingVariables)
	assert.notOk(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})
