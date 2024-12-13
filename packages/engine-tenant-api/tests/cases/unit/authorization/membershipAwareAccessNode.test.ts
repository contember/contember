import { test, expect } from 'bun:test'
import { testUuid } from '../../../src/testUuid'
import { AclSchemaAccessNodeFactory, PermissionActions } from '../../../../src'
import { Acl } from '@contember/schema'

const siteIdA = testUuid(666)
const siteIdB = testUuid(667)
const aclSchemaAdminCanManageEditorWithMatchingVariables: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				invite: true,
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
	const node = new AclSchemaAccessNodeFactory().create(aclSchemaAdminCanManageEditorWithMatchingVariables, adminOfSiteA)

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteA))).toBeTrue()
})

test('admin cannot assign editor role with different variable', async () => {
	const node = new AclSchemaAccessNodeFactory().create(aclSchemaAdminCanManageEditorWithMatchingVariables, adminOfSiteA)
	expect(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_ADD_MEMBER(editorOfSiteB))).toBeFalse()
})

test('admin can invite editor role with matching variable', async () => {
	const node = new AclSchemaAccessNodeFactory().create(aclSchemaAdminCanManageEditorWithMatchingVariables, adminOfSiteA)

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PERSON_INVITE(editorOfSiteA))).toBeTrue()
})


const aclSchemaForInviteOnly: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				invite: {
					public: true,
				},
				manage: {
					lorem: true,
				},
			},
		},
	},
}


test('admin can invite public. cannot manage public, cannot invite lorem', async () => {
	const node = new AclSchemaAccessNodeFactory().create(aclSchemaForInviteOnly, [{ role: 'admin', variables: [] }])

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PERSON_INVITE([{ role: 'public', variables: [] }]))).toBeTrue()

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PERSON_INVITE([{ role: 'lorem', variables: [] }]))).toBeFalse()

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_REMOVE_MEMBER([{ role: 'public', variables: [] }]))).toBeFalse()
})


const aclSchemaForViewOnly: Acl.Schema = {
	roles: {
		admin: {
			entities: {},
			variables: {},
			tenant: {
				view: {
					lorem: true,
				},
			},
		},
	},
}


test('admin can view lorem, but cannot manage it', async () => {
	const node = new AclSchemaAccessNodeFactory().create(aclSchemaForViewOnly, [{ role: 'admin', variables: [] }])

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_VIEW_MEMBER([{ role: 'lorem', variables: [] }]))).toBeTrue()

	expect(await node.isAllowed(aclEvaluator, PermissionActions.PROJECT_REMOVE_MEMBER([{ role: 'lorem', variables: [] }]))).toBeFalse()
})
