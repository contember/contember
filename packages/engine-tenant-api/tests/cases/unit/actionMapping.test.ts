import { describe, expect, test } from 'bun:test'
import { translateAction } from '../../../src/model/authorization/actionMapping'
import { PermissionActions } from '../../../src/model/authorization/PermissionActions'
import { StaticIdentity } from '../../../src/model/authorization/Identity'
import { Acl } from '@contember/schema'

/**
 * `actionMapping` is the legacy→engine bridge: it decides which `subject.*`
 * context an action populates, and defaults missing `meta.roles` to `[]` (not
 * `undefined`) to preserve legacy verifier semantics. A regression here would
 * silently change authorization while the engine-integration tests still pass,
 * so the classification is pinned directly.
 */
const identity = new StaticIdentity('id-1', ['project_admin'])

const membership = (role: string): Acl.Membership => ({ role, variables: [] })

describe('translateAction — engine action string', () => {
	test('builds `tenant:<resource>.<verb>` and threads the identity', () => {
		const result = translateAction(PermissionActions.PROJECT_VIEW, identity)
		expect(result.engineAction).toBe('tenant:project.view')
		expect(result.baseContext.identity).toEqual({ id: 'id-1', roles: ['project_admin'] })
	})

	test('applies PRIVILEGE_OVERRIDE for verbs that diverge from the legacy name', () => {
		expect(translateAction(PermissionActions.PERSON_INVITE_UNMANAGED([]), identity).engineAction)
			.toBe('tenant:person.inviteUnmanaged')
		expect(translateAction(PermissionActions.PROJECT_VIEW_MEMBER([]), identity).engineAction)
			.toBe('tenant:project.viewMember')
		expect(translateAction(PermissionActions.ENTRYPOINT_DEPLOY, identity).engineAction)
			.toBe('tenant:entrypoint.deploy')
	})
})

describe('translateAction — allowlist (subject.roles) actions', () => {
	const actions = {
		'identity.addGlobalRoles': PermissionActions.IDENTITY_ADD_GLOBAL_ROLES,
		'identity.removeGlobalRoles': PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES,
		'apiKey.createGlobal': PermissionActions.API_KEY_CREATE_GLOBAL,
		'person.signUp': PermissionActions.PERSON_SIGN_UP,
	}

	for (const [key, factory] of Object.entries(actions)) {
		test(`${key} populates subject.roles from meta`, () => {
			const result = translateAction(factory(['editor', 'viewer']), identity)
			expect(result.baseContext.subject).toEqual({ roles: ['editor', 'viewer'] })
			expect(result.subjectMemberships).toBeUndefined()
		})

		test(`${key} defaults missing roles to [] (legacy PASS semantics)`, () => {
			const result = translateAction(factory(undefined), identity)
			expect(result.baseContext.subject).toEqual({ roles: [] })
		})
	}
})

describe('translateAction — denylist (subject.targetRoles) actions', () => {
	const actions = {
		'person.disable': PermissionActions.PERSON_DISABLE,
		'person.changeProfile': PermissionActions.PERSON_CHANGE_PROFILE,
		'person.changePassword': PermissionActions.PERSON_CHANGE_PASSWORD,
		'person.createSessionToken': PermissionActions.PERSON_CREATE_SESSION_KEY,
	}

	for (const [key, factory] of Object.entries(actions)) {
		test(`${key} populates subject.targetRoles from meta`, () => {
			const result = translateAction(factory(['super_admin']), identity)
			expect(result.baseContext.subject).toEqual({ targetRoles: ['super_admin'] })
			expect(result.subjectMemberships).toBeUndefined()
		})

		test(`${key} defaults missing roles to []`, () => {
			const result = translateAction(factory(undefined), identity)
			expect(result.baseContext.subject).toEqual({ targetRoles: [] })
		})
	}
})

describe('translateAction — membership actions', () => {
	const actions = {
		'person.invite': PermissionActions.PERSON_INVITE,
		'person.invite_unmanaged': PermissionActions.PERSON_INVITE_UNMANAGED,
		'project.viewMembers': PermissionActions.PROJECT_VIEW_MEMBER,
		'project.addMember': PermissionActions.PROJECT_ADD_MEMBER,
		'project.updateMember': PermissionActions.PROJECT_UPDATE_MEMBER,
		'project.removeMember': PermissionActions.PROJECT_REMOVE_MEMBER,
	}

	for (const [key, factory] of Object.entries(actions)) {
		test(`${key} carries memberships for per-membership AND-reduction`, () => {
			const memberships = [membership('editor'), membership('viewer')]
			const result = translateAction(factory(memberships), identity)
			expect(result.subjectMemberships).toEqual(memberships)
			// membership actions do not populate the role-based subject context
			expect(result.baseContext.subject).toBeUndefined()
		})

		test(`${key} yields an empty membership array when none are passed`, () => {
			const result = translateAction(factory([]), identity)
			expect(result.subjectMemberships).toEqual([])
		})
	}
})

describe('translateAction — plain actions', () => {
	test('non-guarded action carries neither subject nor memberships', () => {
		const result = translateAction(PermissionActions.PROJECT_VIEW, identity)
		expect(result.baseContext.subject).toBeUndefined()
		expect(result.subjectMemberships).toBeUndefined()
	})
})
