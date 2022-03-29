import { test, assert } from 'vitest'
import { MembershipAwareAccessNode } from '../../../../src/model/authorization/MembershipAwareAccessNode'
import { testUuid } from '@contember/engine-api-tester'
import { PermissionActions } from '../../../../src'
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
const aclSchemaAdminCanManageEditorAny: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				manage: {
					editor: {
						variables: true,
					},
				},
			},
		},
	},
}

const aclSchemaAdminCanManageEditorAnySiteVariable: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				manage: {
					editor: {
						variables: { site: true },
					},
				},
			},
		},
	},
}
const aclSchemaAdminCanManageEditorWithoutVariables: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				manage: {
					editor: {},
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
	const node = new MembershipAwareAccessNode([...adminOfSiteA, ...editorOfSiteB], aclSchemaAdminCanManageEditorWithMatchingVariables)
	assert.notOk(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})

test('admin cannot assign editor role with matching variable, but in a different role', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorWithMatchingVariables)
	assert.notOk(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})

test('editor cannot assign editor role', async () => {
	const node = new MembershipAwareAccessNode(editorOfSiteA, aclSchemaAdminCanManageEditorWithMatchingVariables)

	assert.notOk(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteA)))
})

test('admin can assign editor role with any variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorAny)

	assert.ok(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})

test('admin cannot assign editor role with any variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorWithoutVariables)
	assert.notOk(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})

test('admin can assign editor role without variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorWithoutVariables)
	assert.ok(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER([{ role: 'editor', variables: [] }])))
})

test('admin can assign editor role with any variable', async () => {
	const node = new MembershipAwareAccessNode(adminOfSiteA, aclSchemaAdminCanManageEditorAnySiteVariable)

	assert.ok(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB)))
})

