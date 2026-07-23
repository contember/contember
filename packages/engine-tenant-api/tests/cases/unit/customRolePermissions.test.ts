import { describe, expect, test } from 'bun:test'
import {
	buildCustomRolePermissions,
	CustomRoleGrantValidationError,
	CustomRoleRow,
	getGrantablePermissions,
	parseCustomRoleGrants,
	PermissionActions,
	TargetIdentityPermissionTarget,
} from '../../../src/index.js'
import { Permissions } from '@contember/authorization'

const NOW = new Date('2026-07-22T12:00:00.000Z')

const target = (
	globalRoles: readonly string[],
	hasProjectMemberships = false,
): TargetIdentityPermissionTarget => ({
	id: 'target',
	globalRoles,
	hasProjectMemberships,
})

const customRoleRow = (slug: string, grants: unknown): CustomRoleRow => ({
	id: 'id-' + slug,
	slug,
	description: null,
	grants,
	created_at: NOW,
	updated_at: NOW,
	deleted_at: null,
})

const targetConfig = (allowed: readonly string[], projectMemberships: 'none' | 'any' = 'any') => ({
	target: {
		globalRoles: { allowed, denied: [] },
		projectMemberships,
	},
})

describe('explicit grantable permission catalog', () => {
	test('matches the complete explicit registry', () => {
		expect(
			[...getGrantablePermissions().values()]
				.sort((left, right) => left.name.localeCompare(right.name))
				.map(definition => [definition.name, definition.configurationKind, definition.configurationRequired]),
		).toEqual([
			['apiKey:createGlobal', 'GLOBAL_API_KEY', true],
			['apiKey:list', 'NONE', false],
			['customRole:view', 'NONE', false],
			['entrypoint:deployEntrypoint', 'NONE', false],
			['identity:addGlobalRoles', 'ROLE_MUTATION', true],
			['identity:removeGlobalRoles', 'ROLE_MUTATION', true],
			['idp:disable', 'NONE', false],
			['idp:enable', 'NONE', false],
			['idp:list', 'NONE', false],
			['mailTemplate:add', 'MAIL_TEMPLATE_SCOPE', true],
			['mailTemplate:list', 'MAIL_TEMPLATE_SCOPE', true],
			['mailTemplate:remove', 'MAIL_TEMPLATE_SCOPE', true],
			['person:changePassword', 'TARGET_IDENTITY', true],
			['person:changeProfile', 'CHANGE_PROFILE', true],
			['person:createSessionToken', 'CREATE_SESSION_TOKEN', true],
			['person:disable', 'TARGET_IDENTITY', true],
			['person:forceSignOut', 'TARGET_IDENTITY', true],
			['person:list', 'NONE', false],
			['person:resetMfa', 'TARGET_IDENTITY', true],
			['person:signUp', 'ROLE_INPUT', true],
			['person:view', 'NONE', false],
			['person:viewIdp', 'TARGET_IDENTITY', true],
			['person:viewSessions', 'TARGET_IDENTITY', true],
			['project:create', 'NONE', false],
			['system:configure', 'NONE', false],
			['system:viewAuthLog', 'NONE', false],
			['system:viewConfig', 'NONE', false],
		])
	})

	test('contains configured v1 actions', () => {
		const catalog = getGrantablePermissions()
		for (
			const name of [
				'person:changePassword',
				'person:changeProfile',
				'person:createSessionToken',
				'identity:addGlobalRoles',
				'identity:removeGlobalRoles',
				'apiKey:createGlobal',
				'mailTemplate:add',
				'mailTemplate:remove',
				'mailTemplate:list',
			]
		) {
			expect(catalog.has(name)).toBe(true)
		}
	})

	test('does not automatically expose project, membership, IdP-write, or recursive administration actions', () => {
		const catalog = getGrantablePermissions()
		for (
			const name of [
				'project:view',
				'project:addMember',
				'person:invite',
				'apiKey:create',
				'idp:add',
				'idp:update',
				'customRole:manage',
			]
		) {
			expect(catalog.has(name)).toBe(false)
		}
	})
})

describe('parseCustomRoleGrants', () => {
	test('canonicalizes grants and role lists', () => {
		const parsed = parseCustomRoleGrants([
			{ permission: 'person:list' },
			{
				permission: 'person:signUp',
				config: { roles: { allowed: ['support', 'login', 'support'] } },
			},
		])
		expect(parsed.grants).toEqual([
			{ permission: 'person:list', config: null },
			{
				permission: 'person:signUp',
				config: { roles: { allowed: ['login', 'support'], denied: [] } },
			},
		])
		expect(parsed.referencedRoles).toEqual(['login', 'support'])
	})

	test('rejects duplicate permissions, unknown fields, and protected delegated roles', () => {
		expect(() =>
			parseCustomRoleGrants([
				{ permission: 'person:list' },
				{ permission: 'person:list' },
			])
		).toThrow(CustomRoleGrantValidationError)
		expect(() =>
			parseCustomRoleGrants([
				{ permission: 'person:signUp', config: { roles: { allowed: [] }, typo: true } },
			])
		).toThrow(CustomRoleGrantValidationError)
		expect(() =>
			parseCustomRoleGrants([
				{ permission: 'person:signUp', config: { roles: { allowed: ['super_admin'] } } },
			])
		).toThrow(CustomRoleGrantValidationError)
	})
})

describe('compiled custom role permissions', () => {
	test('sign-up role filters apply to assigned input roles, including configured denies', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('onboarding', [{
				permission: 'person:signUp',
				config: { roles: { allowed: ['login', 'support'], denied: ['support'] } },
			}]),
		])
		const ordinary = PermissionActions.PERSON_SIGN_UP([])
		expect(permissions.isAllowed('onboarding', ordinary.resource, ordinary.privilege, ordinary.meta)).toBe(true)
		const login = PermissionActions.PERSON_SIGN_UP(['login'])
		expect(permissions.isAllowed('onboarding', login.resource, login.privilege, login.meta)).toBe(true)
		const denied = PermissionActions.PERSON_SIGN_UP(['support'])
		expect(permissions.isAllowed('onboarding', denied.resource, denied.privilege, denied.meta)).toBe(false)
		const protectedRole = PermissionActions.PERSON_SIGN_UP(['project_creator'])
		expect(permissions.isAllowed('onboarding', protectedRole.resource, protectedRole.privilege, protectedRole.meta)).toBe(false)
	})

	test('target constraints are explicit and project-membership aware', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('support', [
				{
					permission: 'person:changePassword',
					config: targetConfig(['person'], 'none'),
				},
			]),
		])
		const ordinary = PermissionActions.PERSON_CHANGE_PASSWORD(target(['person']))
		expect(permissions.isAllowed('support', ordinary.resource, ordinary.privilege, ordinary.meta)).toBe(true)
		const projectMember = PermissionActions.PERSON_CHANGE_PASSWORD(target(['person'], true))
		expect(permissions.isAllowed('support', projectMember.resource, projectMember.privilege, projectMember.meta)).toBe(false)
		const protectedTarget = PermissionActions.PERSON_CHANGE_PASSWORD(target(['super_admin']))
		expect(permissions.isAllowed('support', protectedTarget.resource, protectedTarget.privilege, protectedTarget.meta)).toBe(false)
	})

	test('configured denied roles narrow access and immutable denied roles cannot be re-enabled', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('support', [
				{
					permission: 'person:changePassword',
					config: {
						target: {
							globalRoles: { allowed: ['login', 'person'], denied: ['login'] },
							projectMemberships: 'any',
						},
					},
				},
			]),
		])
		const denied = PermissionActions.PERSON_CHANGE_PASSWORD(target(['login']))
		expect(permissions.isAllowed('support', denied.resource, denied.privilege, denied.meta)).toBe(false)
		expect(() =>
			parseCustomRoleGrants([{
				permission: 'person:changePassword',
				config: {
					target: {
						globalRoles: { allowed: ['person', 'super_admin'], denied: [] },
						projectMemberships: 'any',
					},
				},
			}])
		).toThrow(CustomRoleGrantValidationError)
	})

	test('profile grants constrain both target facts and the changed fields', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('profile_support', [{
				permission: 'person:changeProfile',
				config: {
					...targetConfig(['person']),
					fields: { allowed: ['name'] },
				},
			}]),
		])
		const name = PermissionActions.PERSON_CHANGE_PROFILE(target(['person']), ['name'])
		expect(permissions.isAllowed('profile_support', name.resource, name.privilege, name.meta)).toBe(true)
		const email = PermissionActions.PERSON_CHANGE_PROFILE(target(['person']), ['email'])
		expect(permissions.isAllowed('profile_support', email.resource, email.privilege, email.meta)).toBe(false)
	})

	test('global role mutation checks requested roles, target, and self assignment', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('role_manager', [
				{
					permission: 'identity:addGlobalRoles',
					config: {
						roles: { allowed: ['support'] },
						...targetConfig(['person', 'support']),
						allowSelf: false,
					},
				},
			]),
		])
		const allowed = PermissionActions.IDENTITY_ADD_GLOBAL_ROLES({
			requestedRoles: ['support'],
			target: target(['person']),
			self: false,
		})
		expect(permissions.isAllowed('role_manager', allowed.resource, allowed.privilege, allowed.meta)).toBe(true)
		const self = PermissionActions.IDENTITY_ADD_GLOBAL_ROLES({
			requestedRoles: ['support'],
			target: target(['person']),
			self: true,
		})
		expect(permissions.isAllowed('role_manager', self.resource, self.privilege, self.meta)).toBe(false)
	})

	test('session-token grants require bounded explicit expiration and configured forwarding trust', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('support', [
				{
					permission: 'person:createSessionToken',
					config: {
						...targetConfig(['person']),
						session: {
							maxExpirationMinutes: 30,
							allowTrustForwardedClientInfo: false,
						},
					},
				},
			]),
		])
		const preflight = PermissionActions.PERSON_CREATE_SESSION_KEY({ phase: 'preflight' })
		expect(permissions.isAllowed('support', preflight.resource, preflight.privilege, preflight.meta)).toBe(true)
		const allowed = PermissionActions.PERSON_CREATE_SESSION_KEY({
			phase: 'target',
			target: target(['person']),
			requestedExpirationMinutes: 30,
			trustForwardedClientInfo: false,
		})
		expect(permissions.isAllowed('support', allowed.resource, allowed.privilege, allowed.meta)).toBe(true)
		const unbounded = PermissionActions.PERSON_CREATE_SESSION_KEY({
			phase: 'target',
			target: target(['person']),
			requestedExpirationMinutes: null,
			trustForwardedClientInfo: false,
		})
		expect(permissions.isAllowed('support', unbounded.resource, unbounded.privilege, unbounded.meta)).toBe(false)
	})

	test('global API key grants constrain assigned roles and forwarding trust', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('integration_manager', [{
				permission: 'apiKey:createGlobal',
				config: {
					roles: { allowed: ['login'], denied: [] },
					allowTrustForwardedClientInfo: false,
				},
			}]),
		])
		const allowed = PermissionActions.API_KEY_CREATE_GLOBAL({
			requestedRoles: ['login'],
			trustForwardedClientInfo: false,
		})
		expect(permissions.isAllowed('integration_manager', allowed.resource, allowed.privilege, allowed.meta)).toBe(true)
		const wrongRole = PermissionActions.API_KEY_CREATE_GLOBAL({
			requestedRoles: ['project_admin'],
			trustForwardedClientInfo: false,
		})
		expect(permissions.isAllowed('integration_manager', wrongRole.resource, wrongRole.privilege, wrongRole.meta)).toBe(false)
		const forwarded = PermissionActions.API_KEY_CREATE_GLOBAL({
			requestedRoles: ['login'],
			trustForwardedClientInfo: true,
		})
		expect(permissions.isAllowed('integration_manager', forwarded.resource, forwarded.privilege, forwarded.meta)).toBe(false)
	})

	test('mail template grants match exact scope and type', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('mailer', [
				{
					permission: 'mailTemplate:list',
					config: {
						global: false,
						projects: ['blog'],
						types: ['FORCED_SIGN_OUT'],
					},
				},
			]),
		])
		const allowed = PermissionActions.MAIL_TEMPLATE_LIST({
			kind: 'project',
			projectSlug: 'blog',
			type: 'FORCED_SIGN_OUT',
		})
		expect(permissions.isAllowed('mailer', allowed.resource, allowed.privilege, allowed.meta)).toBe(true)
		const wrongProject = PermissionActions.MAIL_TEMPLATE_LIST({
			kind: 'project',
			projectSlug: 'shop',
			type: 'FORCED_SIGN_OUT',
		})
		expect(permissions.isAllowed('mailer', wrongProject.resource, wrongProject.privilege, wrongProject.meta)).toBe(false)
	})

	test('a role with any invalid persisted grant is entirely inert', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('support', [
				{ permission: 'person:list', config: null },
				{ permission: 'person:changePassword', config: { target: 'invalid' } },
			]),
		])
		expect(permissions.isAllowed('support', 'person', 'list', undefined)).toBe(false)
		const action = PermissionActions.PERSON_CHANGE_PASSWORD(target(['person']))
		expect(permissions.isAllowed('support', action.resource, action.privilege, action.meta)).toBe(false)
	})

	test('object-prototype role names cannot leak permissions between maps', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('constructor', [{ permission: 'person:list', config: null }]),
		])
		expect(permissions.isAllowed('constructor', 'person', 'list', undefined)).toBe(true)

		const unrelated = new Permissions()
		expect(unrelated.isAllowed('constructor', 'person', 'list', undefined)).toBe(false)
	})
})
