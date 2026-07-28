import { expect, test } from 'bun:test'
import { AccessNode, AuthorizationScope, Authorizator, Permissions } from '@contember/authorization'
import { CustomRoleAuthorizator } from '../../../src/model/authorization/CustomRoleAuthorizator.js'
import { Identity } from '../../../src/model/authorization/Identity.js'
import { buildCustomRolePermissions } from '../../../src/model/authorization/CustomRolePermissions.js'
import { PermissionActions } from '../../../src/model/authorization/PermissionActions.js'
import { TenantRole } from '../../../src/model/authorization/Roles.js'
import { CustomRoleRow } from '../../../src/model/type/index.js'
import { DatabaseContext } from '../../../src/model/utils/index.js'

const identity = (roles: readonly string[]): Identity => ({ id: 'identity-1', roles } as unknown as Identity)

const scope = new AuthorizationScope.Global()

const row = (slug: string, grants: readonly object[]): CustomRoleRow => ({
	id: 'role-1',
	slug,
	description: null,
	grants,
	created_at: new Date(),
	updated_at: new Date(),
})

/** Counts real `custom_role` reads, so the per-request query budget is observable. */
const countingDb = (rows: readonly CustomRoleRow[]) => {
	let queries = 0
	const db = {
		queryHandler: {
			fetch: async () => {
				queries++
				return [...rows]
			},
		},
	} as unknown as DatabaseContext
	return { db, queries: () => queries }
}

const innerAuthorizator = (allowed: boolean): Authorizator<Identity> => ({
	isAllowed: async () => allowed,
})

const listAction = PermissionActions.PERSON_LIST
const supportRole = () => row('support', [{ permission: 'person:list', config: null }])

test('an inner allow short-circuits before any custom-role lookup', async () => {
	const { db, queries } = countingDb([supportRole()])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(true), db)

	expect(await authorizator.isAllowed(identity(['support']), scope, listAction)).toBe(true)
	// the "at most one query per request, and only when the static check denied" claim
	expect(queries()).toBe(0)
})

test('an identity carrying only built-in roles never queries for definitions', async () => {
	const { db, queries } = countingDb([supportRole()])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)

	expect(await authorizator.isAllowed(identity([TenantRole.PROJECT_ADMIN, TenantRole.PERSON]), scope, listAction)).toBe(false)
	expect(queries()).toBe(0)
})

test('a non-builtin slug grants exactly what its definition carries, and queries once', async () => {
	const { db, queries } = countingDb([supportRole()])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)

	expect(await authorizator.isAllowed(identity(['support']), scope, listAction)).toBe(true)
	expect(await authorizator.isAllowed(identity(['support']), scope, PermissionActions.API_KEY_LIST)).toBe(false)
	expect(await authorizator.isAllowed(identity(['other']), scope, listAction)).toBe(false)
	expect(queries()).toBe(1)
})

test('a row whose slug collides with a built-in role grants nothing', async () => {
	// Backstop for the write-time slug check: a project_admin identity must not pick up a
	// bundle from a `project_admin` row, however that row got into the table.
	const { db, queries } = countingDb([row(TenantRole.PROJECT_ADMIN, [{ permission: 'person:list', config: null }])])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)

	expect(await authorizator.isAllowed(identity([TenantRole.PROJECT_ADMIN]), scope, listAction)).toBe(false)
	expect(queries()).toBe(0)
})

test('preload resolves definitions only for identities that carry a custom role', async () => {
	const builtinOnly = countingDb([supportRole()])
	await new CustomRoleAuthorizator(innerAuthorizator(false), builtinOnly.db).preload([TenantRole.PROJECT_ADMIN])
	expect(builtinOnly.queries()).toBe(0)

	const withCustom = countingDb([supportRole()])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), withCustom.db)
	await authorizator.preload(['support'])
	expect(withCustom.queries()).toBe(1)

	// the preloaded result is what the later check uses — no second lookup mid-request
	expect(await authorizator.isAllowed(identity(['support']), scope, listAction)).toBe(true)
	expect(withCustom.queries()).toBe(1)
})

test('a definition that no longer parses leaves the role inert', async () => {
	const { db } = countingDb([row('support', [{ permission: 'no:such:permission', config: null }])])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)

	expect(await authorizator.isAllowed(identity(['support']), scope, listAction)).toBe(false)
})

test('compiled grants are keyed by slug alone, so no identity state can leak between roles', () => {
	const permissions: Permissions = buildCustomRolePermissions([supportRole()])

	expect(permissions.isAllowed('support', listAction.resource, listAction.privilege, listAction.meta)).toBe(true)
	expect(permissions.isAllowed('other', listAction.resource, listAction.privilege, listAction.meta)).toBe(false)
})

test('a tenant-global grant cannot answer a project-scoped check', async () => {
	// `Permissions.isAllowed` never sees the scope, so a grant that satisfied a project-scoped
	// check would satisfy it on EVERY project — while the equivalent static project_admin grant
	// is bounded by ProjectScope. Only grants carrying their own project filter may try.
	const projectScope = new AuthorizationScope.Fixed(AccessNode.Fixed.denied())
	const { db } = countingDb([supportRole()])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)

	expect(await authorizator.isAllowed(identity(['support']), scope, listAction)).toBe(true)
	expect(await authorizator.isAllowed(identity(['support']), projectScope, listAction)).toBe(false)
})

test('a mail-template grant still answers a project-scoped check, on its own exact filter', async () => {
	const projectScope = new AuthorizationScope.Fixed(AccessNode.Fixed.denied())
	const { db } = countingDb([row('editor', [{
		permission: 'mailTemplate:add',
		config: { global: false, projects: ['project-a'], types: ['RESET_PASSWORD_REQUEST'] },
	}])])
	const authorizator = new CustomRoleAuthorizator(innerAuthorizator(false), db)
	const forProject = (projectSlug: string) =>
		PermissionActions.MAIL_TEMPLATE_ADD({ kind: 'project', projectSlug, type: 'RESET_PASSWORD_REQUEST' })

	expect(await authorizator.isAllowed(identity(['editor']), projectScope, forProject('project-a'))).toBe(true)
	expect(await authorizator.isAllowed(identity(['editor']), projectScope, forProject('project-b'))).toBe(false)
})
