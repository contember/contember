import { describe, expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { AccessEvaluator, AuthorizationScope, Authorizator } from '@contember/authorization'
import {
	buildCustomRolePermissions,
	CustomRoleAccessEvaluator,
	DatabaseContext,
	getGrantablePermissions,
	PermissionActions,
	PermissionsFactory,
	Providers,
	StaticIdentity,
} from '../../../src/index.js'

const NOW = new Date('2026-07-22T12:00:00.000Z')

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: (len: number) => Promise.resolve(Buffer.alloc(len)),
	uuid: () => 'uuid',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: value => Buffer.from(value.toString()),
}

const makeDb = (queries: ExpectedQuery[]) => {
	const connection = createConnectionMock(queries)
	return new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)
}

const customRoleRow = (slug: string, permissions: string[]) => ({
	id: 'id-' + slug,
	slug,
	description: null,
	permissions,
	created_at: NOW,
	updated_at: NOW,
})

const CUSTOM_ROLES_SQL = `select *  from "tenant"."custom_role" where "slug" in (?)  order by "slug" asc`

describe('grantable permission catalog', () => {
	test('contains the person admin bundle', () => {
		const catalog = getGrantablePermissions()
		for (const name of ['person:forceSignOut', 'person:resetMfa', 'person:disable', 'person:viewSessions', 'person:list', 'customRole:view']) {
			expect(catalog.has(name)).toBe(true)
		}
	})

	test('never contains escalation vectors', () => {
		const catalog = getGrantablePermissions()
		for (
			const name of ['identity:addGlobalRoles', 'identity:removeGlobalRoles', 'apiKey:createGlobal', 'person:createSessionToken', 'customRole:manage']
		) {
			expect(catalog.has(name)).toBe(false)
		}
	})

	test('detects roles-parameterized actions', () => {
		const catalog = getGrantablePermissions()
		expect(catalog.get('person:forceSignOut')?.hasRolesMeta).toBe(true)
		expect(catalog.get('person:resetMfa')?.hasRolesMeta).toBe(true)
		expect(catalog.get('person:list')?.hasRolesMeta).toBe(false)
	})
})

describe('buildCustomRolePermissions', () => {
	test('grants listed actions, skips unknown ones', () => {
		const permissions = buildCustomRolePermissions([customRoleRow('support', ['person:forceSignOut', 'no:such', 'identity:addGlobalRoles'])])
		const allowed = PermissionActions.PERSON_FORCE_SIGN_OUT(['person'])
		expect(permissions.isAllowed('support', allowed.resource, allowed.privilege, allowed.meta)).toBe(true)
		// denylisted name in a row is ignored even if it slipped past write-time validation
		const escalation = PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(['login'])
		expect(permissions.isAllowed('support', escalation.resource, escalation.privilege, escalation.meta)).toBe(false)
	})

	test('roles-parameterized grants never target super_admin or project_creator', () => {
		const permissions = buildCustomRolePermissions([customRoleRow('support', ['person:forceSignOut'])])
		const forbidden = PermissionActions.PERSON_FORCE_SIGN_OUT(['super_admin'])
		expect(permissions.isAllowed('support', forbidden.resource, forbidden.privilege, forbidden.meta)).toBe(false)
		const forbidden2 = PermissionActions.PERSON_FORCE_SIGN_OUT(['project_creator'])
		expect(permissions.isAllowed('support', forbidden2.resource, forbidden2.privilege, forbidden2.meta)).toBe(false)
	})
})

describe('CustomRoleAccessEvaluator', () => {
	const staticEvaluator = new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create())

	const createAuthorizator = (db: DatabaseContext) => new Authorizator.Default(new CustomRoleAccessEvaluator(staticEvaluator, db))

	test('static roles pass without touching the database', async () => {
		const db = makeDb([])
		const authorizator = createAuthorizator(db)
		const identity = new StaticIdentity('id', ['super_admin'])
		const allowed = await authorizator.isAllowed(identity, new AuthorizationScope.Global(), PermissionActions.PERSON_FORCE_SIGN_OUT(['person']))
		expect(allowed).toBe(true)
	})

	test('custom role grants its bundle, single query per request', async () => {
		const db = makeDb([
			{
				sql: CUSTOM_ROLES_SQL,
				parameters: ['support'],
				response: { rows: [customRoleRow('support', ['person:forceSignOut', 'person:viewSessions'])] },
			},
		])
		const authorizator = createAuthorizator(db)
		const identity = new StaticIdentity('id', ['person', 'support'])
		const scope = new AuthorizationScope.Global()
		expect(await authorizator.isAllowed(identity, scope, PermissionActions.PERSON_FORCE_SIGN_OUT(['person']))).toBe(true)
		// second check is served from the memoized load — the mock would fail on a second query
		expect(await authorizator.isAllowed(identity, scope, PermissionActions.PERSON_VIEW_SESSIONS(['person']))).toBe(true)
		// not in the bundle
		expect(await authorizator.isAllowed(identity, scope, PermissionActions.PERSON_RESET_MFA(['person']))).toBe(false)
	})

	test('custom role cannot target a super_admin', async () => {
		const db = makeDb([
			{
				sql: CUSTOM_ROLES_SQL,
				parameters: ['support'],
				response: { rows: [customRoleRow('support', ['person:forceSignOut'])] },
			},
		])
		const authorizator = createAuthorizator(db)
		const identity = new StaticIdentity('id', ['support'])
		const allowed = await authorizator.isAllowed(identity, new AuthorizationScope.Global(), PermissionActions.PERSON_FORCE_SIGN_OUT(['super_admin']))
		expect(allowed).toBe(false)
	})

	test('unknown role without a row grants nothing', async () => {
		const db = makeDb([
			{
				sql: CUSTOM_ROLES_SQL,
				parameters: ['ghost'],
				response: { rows: [] },
			},
		])
		const authorizator = createAuthorizator(db)
		const identity = new StaticIdentity('id', ['ghost'])
		const allowed = await authorizator.isAllowed(identity, new AuthorizationScope.Global(), PermissionActions.PERSON_FORCE_SIGN_OUT(['person']))
		expect(allowed).toBe(false)
	})

	test('builtin-only identities never query the database', async () => {
		const db = makeDb([])
		const authorizator = createAuthorizator(db)
		const identity = new StaticIdentity('id', ['person'])
		const allowed = await authorizator.isAllowed(identity, new AuthorizationScope.Global(), PermissionActions.PERSON_FORCE_SIGN_OUT(['person']))
		expect(allowed).toBe(false)
	})
})
