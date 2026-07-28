import { describe, expect, test } from 'bun:test'
import {
	buildCustomRolePermissions,
	CustomRoleGrantValidationError,
	CustomRoleRow,
	getGrantablePermissions,
	isConfigurationRequired,
	parseCustomRoleGrants,
	PermissionActions,
	PermissionsFactory,
	TargetIdentityPermissionTarget,
	TenantRole,
} from '../../../src/index.js'
import { Authorizator, Permissions } from '@contember/authorization'

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
})

const targetConfig = (allowed: readonly string[], projectMemberships: 'none' | 'any' = 'any') => ({
	target: {
		globalRoles: { allowed },
		projectMemberships,
	},
})

describe('explicit grantable permission catalog', () => {
	test('matches the complete explicit registry', () => {
		expect(
			[...getGrantablePermissions().values()]
				.sort((left, right) => left.name.localeCompare(right.name))
				.map(definition => [definition.name, definition.configurationKind, isConfigurationRequired(definition)]),
		).toEqual([
			['apiKey:createGlobal', 'GLOBAL_API_KEY', true],
			['apiKey:list', 'NONE', false],
			['customRole:view', 'NONE', false],
			['entrypoint:deployEntrypoint', 'NONE', false],
			['identity:addGlobalRoles', 'ROLE_MUTATION', true],
			['identity:removeGlobalRoles', 'ROLE_MUTATION', true],
			['identity:viewPermissions', 'NONE', false],
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
			['system:configure', 'NONE', false],
			['system:viewAuthLog', 'NONE', false],
			['system:viewConfig', 'NONE', false],
		])
	})

	test('stays within the project admin permission surface', () => {
		const ordinaryTarget = target(['person'])
		const roleMutationMeta = {
			requestedRoles: ['support'],
			target: ordinaryTarget,
			self: false,
		}
		const actions: { readonly name: string; readonly action: Authorizator.Action }[] = [
			{ name: 'apiKey:createGlobal', action: PermissionActions.API_KEY_CREATE_GLOBAL({ requestedRoles: ['support'], trustForwardedClientInfo: false }) },
			{ name: 'apiKey:list', action: PermissionActions.API_KEY_LIST },
			{ name: 'customRole:view', action: PermissionActions.CUSTOM_ROLE_VIEW },
			{ name: 'entrypoint:deployEntrypoint', action: PermissionActions.ENTRYPOINT_DEPLOY },
			{ name: 'identity:addGlobalRoles', action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(roleMutationMeta) },
			{ name: 'identity:removeGlobalRoles', action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(roleMutationMeta) },
			{ name: 'identity:viewPermissions', action: PermissionActions.IDENTITY_VIEW_PERMISSIONS },
			{ name: 'idp:disable', action: PermissionActions.IDP_DISABLE },
			{ name: 'idp:enable', action: PermissionActions.IDP_ENABLE },
			{ name: 'idp:list', action: PermissionActions.IDP_LIST },
			{ name: 'mailTemplate:add', action: PermissionActions.MAIL_TEMPLATE_ADD({ kind: 'global', projectSlug: null, type: 'RESET_PASSWORD_REQUEST' }) },
			{ name: 'mailTemplate:list', action: PermissionActions.MAIL_TEMPLATE_LIST({ kind: 'global', projectSlug: null, type: 'RESET_PASSWORD_REQUEST' }) },
			{
				name: 'mailTemplate:remove',
				action: PermissionActions.MAIL_TEMPLATE_REMOVE({ kind: 'global', projectSlug: null, type: 'RESET_PASSWORD_REQUEST' }),
			},
			{ name: 'person:changePassword', action: PermissionActions.PERSON_CHANGE_PASSWORD(ordinaryTarget) },
			{ name: 'person:changeProfile', action: PermissionActions.PERSON_CHANGE_PROFILE(ordinaryTarget, ['name']) },
			{
				name: 'person:createSessionToken',
				action: PermissionActions.PERSON_CREATE_SESSION_KEY({
					phase: 'target',
					target: ordinaryTarget,
					requestedExpirationMinutes: 30,
					trustForwardedClientInfo: false,
				}),
			},
			{ name: 'person:disable', action: PermissionActions.PERSON_DISABLE(ordinaryTarget) },
			{ name: 'person:forceSignOut', action: PermissionActions.PERSON_FORCE_SIGN_OUT(ordinaryTarget) },
			{ name: 'person:list', action: PermissionActions.PERSON_LIST },
			{ name: 'person:resetMfa', action: PermissionActions.PERSON_RESET_MFA(ordinaryTarget) },
			{ name: 'person:signUp', action: PermissionActions.PERSON_SIGN_UP(['support']) },
			{ name: 'person:view', action: PermissionActions.PERSON_VIEW },
			{ name: 'person:viewIdp', action: PermissionActions.PERSON_VIEW_IDP(ordinaryTarget) },
			{ name: 'person:viewSessions', action: PermissionActions.PERSON_VIEW_SESSIONS(ordinaryTarget) },
			{ name: 'system:configure', action: PermissionActions.CONFIGURE },
			{ name: 'system:viewAuthLog', action: PermissionActions.AUTH_LOG_VIEW },
			{ name: 'system:viewConfig', action: PermissionActions.CONFIG_VIEW },
		]
		expect(actions.map(({ name }) => name).sort()).toEqual([...getGrantablePermissions().keys()].sort())

		const permissions = new PermissionsFactory().create()
		for (const { action } of actions) {
			expect(permissions.isAllowed(TenantRole.PROJECT_ADMIN, action.resource, action.privilege, action.meta)).toBe(true)
		}
	})

	test('keeps protected roles and protected targets outside the project admin surface', () => {
		// The companion test above only asserts the ALLOW direction, so it gets *greener* as a
		// guard is weakened. This is the other half: every parameterized grant, in a shape
		// project_admin must refuse. Stubbing any verifier to `() => true` has to turn it red.
		const protectedRoles = [TenantRole.SUPER_ADMIN, TenantRole.PROJECT_CREATOR]
		const forbidden: { readonly name: string; readonly why: string; readonly action: Authorizator.Action }[] = []

		for (const role of protectedRoles) {
			const protectedTarget = target([role])
			const roleMutationMeta = { requestedRoles: [role], target: target(['person']), self: false }
			const targetedMutationMeta = { requestedRoles: ['support'], target: protectedTarget, self: false }

			forbidden.push(
				{
					name: 'apiKey:createGlobal',
					why: `mints a global key carrying ${role}`,
					action: PermissionActions.API_KEY_CREATE_GLOBAL({ requestedRoles: [role], trustForwardedClientInfo: false }),
				},
				{
					name: 'person:signUp',
					why: `creates an account holding ${role}`,
					action: PermissionActions.PERSON_SIGN_UP([role]),
				},
				{
					name: 'identity:addGlobalRoles',
					why: `grants ${role}`,
					action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(roleMutationMeta),
				},
				{
					name: 'identity:addGlobalRoles',
					why: `acts on an identity holding ${role}`,
					action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(targetedMutationMeta),
				},
				{
					name: 'identity:removeGlobalRoles',
					why: `revokes ${role}`,
					action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(roleMutationMeta),
				},
				{
					name: 'identity:removeGlobalRoles',
					why: `acts on an identity holding ${role}`,
					action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(targetedMutationMeta),
				},
				{
					name: 'person:createSessionToken',
					why: `impersonates a ${role}`,
					action: PermissionActions.PERSON_CREATE_SESSION_KEY({
						phase: 'target',
						target: protectedTarget,
						requestedExpirationMinutes: 30,
						trustForwardedClientInfo: false,
					}),
				},
				{ name: 'person:changePassword', why: `targets a ${role}`, action: PermissionActions.PERSON_CHANGE_PASSWORD(protectedTarget) },
				{ name: 'person:changeProfile', why: `targets a ${role}`, action: PermissionActions.PERSON_CHANGE_PROFILE(protectedTarget, ['name']) },
				{ name: 'person:disable', why: `targets a ${role}`, action: PermissionActions.PERSON_DISABLE(protectedTarget) },
				{ name: 'person:forceSignOut', why: `targets a ${role}`, action: PermissionActions.PERSON_FORCE_SIGN_OUT(protectedTarget) },
				{ name: 'person:resetMfa', why: `targets a ${role}`, action: PermissionActions.PERSON_RESET_MFA(protectedTarget) },
				{ name: 'person:viewIdp', why: `targets a ${role}`, action: PermissionActions.PERSON_VIEW_IDP(protectedTarget) },
				{ name: 'person:viewSessions', why: `targets a ${role}`, action: PermissionActions.PERSON_VIEW_SESSIONS(protectedTarget) },
			)
		}

		// Not about a protected role: a key trusted to forward client info decides what lands in the
		// audit log and what per-IP rate limits key on, so delegated authority may not mint one at all.
		forbidden.push({
			name: 'apiKey:createGlobal',
			why: 'mints a key trusted to forward client info',
			action: PermissionActions.API_KEY_CREATE_GLOBAL({ requestedRoles: [], trustForwardedClientInfo: true }),
		})

		// Mail-template grants are the one parameterized kind project_admin holds as an
		// unconditional `{kind: 'any'}` wildcard, so no shape of them is forbidden to it.
		const unguarded = ['mailTemplate:add', 'mailTemplate:list', 'mailTemplate:remove']
		const parameterized = [...getGrantablePermissions().values()]
			.filter(definition => definition.configurationKind !== 'NONE')
			.map(definition => definition.name)
			.filter(name => !unguarded.includes(name))
		// a new parameterized grant cannot be added without a negative case here
		expect([...new Set(forbidden.map(({ name }) => name))].sort()).toEqual(parameterized.sort())

		const permissions = new PermissionsFactory().create()
		for (const { name, why, action } of forbidden) {
			const allowed = permissions.isAllowed(TenantRole.PROJECT_ADMIN, action.resource, action.privilege, action.meta)
			expect(`${name} (${why}): ${allowed}`).toBe(`${name} (${why}): false`)
		}
	})

	test('refuses a project api key trusted to forward client info', () => {
		// `apiKey:create` is not grantable to a custom role, so it is outside the catalog tests above —
		// but it mints the same forgeable credential, and project_admin reaches it on every project.
		const permissions = new PermissionsFactory().create()
		const ordinary = PermissionActions.API_KEY_CREATE({ trustForwardedClientInfo: false })
		const trusted = PermissionActions.API_KEY_CREATE({ trustForwardedClientInfo: true })

		expect(permissions.isAllowed(TenantRole.PROJECT_ADMIN, ordinary.resource, ordinary.privilege, ordinary.meta)).toBe(true)
		expect(permissions.isAllowed(TenantRole.PROJECT_ADMIN, trusted.resource, trusted.privilege, trusted.meta)).toBe(false)
		expect(permissions.isAllowed(TenantRole.SUPER_ADMIN, trusted.resource, trusted.privilege, trusted.meta)).toBe(true)
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
				'project:create',
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
				config: { roles: { allowed: ['login', 'support'] } },
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
	test('sign-up role filters apply to assigned input roles', () => {
		const permissions = buildCustomRolePermissions([
			customRoleRow('onboarding', [{
				permission: 'person:signUp',
				config: { roles: { allowed: ['login', 'support'] } },
			}]),
		])
		const ordinary = PermissionActions.PERSON_SIGN_UP([])
		expect(permissions.isAllowed('onboarding', ordinary.resource, ordinary.privilege, ordinary.meta)).toBe(true)
		const listed = PermissionActions.PERSON_SIGN_UP(['login', 'support'])
		expect(permissions.isAllowed('onboarding', listed.resource, listed.privilege, listed.meta)).toBe(true)
		// `allowed` is exhaustive: any role outside it refuses the whole request
		const unlisted = PermissionActions.PERSON_SIGN_UP(['login', 'person'])
		expect(permissions.isAllowed('onboarding', unlisted.resource, unlisted.privilege, unlisted.meta)).toBe(false)
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

	test('protected roles are refused at write time and again when already persisted', () => {
		expect(() =>
			parseCustomRoleGrants([{
				permission: 'person:changePassword',
				config: {
					target: {
						globalRoles: { allowed: ['person', 'super_admin'] },
						projectMemberships: 'any',
					},
				},
			}])
		).toThrow(CustomRoleGrantValidationError)

		// a row written before the role became protected turns the whole bundle inert,
		// rather than silently keeping the grants that happen to still be valid
		const permissions = buildCustomRolePermissions([
			customRoleRow('support', [
				{ permission: 'person:list', config: null },
				{ permission: 'person:changePassword', config: targetConfig(['person', 'super_admin']) },
			]),
		])
		const protectedTarget = PermissionActions.PERSON_CHANGE_PASSWORD(target(['super_admin']))
		expect(permissions.isAllowed('support', protectedTarget.resource, protectedTarget.privilege, protectedTarget.meta)).toBe(false)
		const ordinary = PermissionActions.PERSON_CHANGE_PASSWORD(target(['person']))
		expect(permissions.isAllowed('support', ordinary.resource, ordinary.privilege, ordinary.meta)).toBe(false)
		const unrelated = PermissionActions.PERSON_LIST
		expect(permissions.isAllowed('support', unrelated.resource, unrelated.privilege, unrelated.meta)).toBe(false)
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
					roles: { allowed: ['login'] },
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
