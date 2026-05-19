import { describe, expect, test } from 'bun:test'
import { Acl, ProjectRole, Schema } from '@contember/schema'
import { Statement } from '@contember/policy'
import { emptySchema } from '@contember/schema-utils'
import { PermissionContext } from '../../../src/model/authorization/PermissionContext'
import { StaticIdentity } from '../../../src/model/authorization/Identity'
import { TenantRole } from '../../../src/model/authorization/Roles'
import { PermissionActions } from '../../../src/model/authorization/PermissionActions'
import { ProjectSchemaResolver } from '../../../src/model/type'
import { IdentityPolicyAssignmentsQuery } from '../../../src/model/policy/queries'

// No custom-policy assignments — authorization is driven purely by built-in
// role policies, so we can assert pure project-aware role synthesis.
const stubDb = { queryHandler: { fetch: async () => [] } } as any

// DatabaseContext stub that reports a single `identity_policy` assignment of a
// custom policy whose document carries `statements`. Lets us exercise the
// `TenantDbPolicyProvider` DB path through `PermissionContext`.
const dbWithCustomPolicy = (statements: Statement[]) => ({
	queryHandler: {
		fetch: async (query: unknown) =>
			query instanceof IdentityPolicyAssignmentsQuery
				? [{ identityId: 'identity-1', policyId: 'p1', tags: {}, grantedBy: null, grantedAt: new Date() }]
				: [{ id: 'p1', slug: 'custom', label: '', description: null, document: { version: '1', statements }, version: 1, createdAt: new Date(), updatedAt: new Date() }],
	},
}) as any

const schemaResolver = (schemas: Record<string, Schema | undefined>): ProjectSchemaResolver => ({
	getSchema: async (slug: string) => schemas[slug],
})

const membership = (role: string, variables: Acl.Membership['variables'] = []): Acl.Membership => ({ role, variables })

const makeContext = (
	roles: string[],
	memberships: Record<string, readonly Acl.Membership[]> = {},
	schemas: Record<string, Schema | undefined> = { foo: emptySchema },
	db: any = stubDb,
) => new PermissionContext(
	new StaticIdentity('identity-1', roles, memberships),
	db,
	schemaResolver(schemas),
)

/**
 * Project-aware role synthesis: an identity that is a member/admin of the
 * target project gains PROJECT_MEMBER/PROJECT_ADMIN — but only for that
 * project's resource. This guards the regression where a project-admin via
 * membership lost tenant admin powers on their own project.
 */
describe('PermissionContext — project-aware role synthesis', () => {
	const project = { slug: 'foo' }

	test('admin membership grants project-scoped admin actions', async () => {
		const ctx = makeContext([TenantRole.PERSON], { foo: [membership(ProjectRole.ADMIN)] })
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_VIEW })).toBe(true)
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_ADD_MEMBER([]) })).toBe(true)
		expect(await ctx.isAllowed({ project, action: PermissionActions.API_KEY_CREATE })).toBe(true)
	})

	test('synthesized PROJECT_ADMIN does NOT leak to the global resource', async () => {
		const ctx = makeContext([TenantRole.PERSON], { foo: [membership(ProjectRole.ADMIN)] })
		// Same identity, no project scope (resource '*') — must NOT be admin.
		expect(await ctx.isAllowed({ action: PermissionActions.PROJECT_ADD_MEMBER([]) })).toBe(false)
		expect(await ctx.isAllowed({ action: PermissionActions.API_KEY_CREATE })).toBe(false)
	})

	test('plain membership grants PROJECT_MEMBER (view) but not admin', async () => {
		const ctx = makeContext([TenantRole.PERSON], { foo: [membership('editor')] })
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_VIEW })).toBe(true)
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_ADD_MEMBER([]) })).toBe(false)
	})

	test('no membership → project actions denied', async () => {
		const ctx = makeContext([TenantRole.PERSON], { foo: [] })
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_VIEW })).toBe(false)
	})

	test('super_admin is allowed everything regardless of membership', async () => {
		const ctx = makeContext([TenantRole.SUPER_ADMIN])
		expect(await ctx.isAllowed({ project, action: PermissionActions.PROJECT_ADD_MEMBER([]) })).toBe(true)
		expect(await ctx.isAllowed({ action: PermissionActions.PROJECT_CREATE })).toBe(true)
	})
})

/**
 * `deniedScope` invariant: a project supplied to `isAllowed` that does not
 * exist (null) or whose schema cannot be resolved must deny — never fall
 * through to a global evaluation.
 */
describe('PermissionContext — denied project scope', () => {
	test('null project denies', async () => {
		const ctx = makeContext([TenantRole.SUPER_ADMIN])
		expect(await ctx.isAllowed({ project: null, action: PermissionActions.PROJECT_VIEW })).toBe(false)
	})

	test('unresolvable schema denies', async () => {
		const ctx = makeContext([TenantRole.SUPER_ADMIN], {}, { foo: undefined })
		expect(await ctx.isAllowed({ project: { slug: 'foo' }, action: PermissionActions.PROJECT_VIEW })).toBe(false)
	})
})

/**
 * Membership-aware actions (add/update/remove member, invite) are authorized
 * only if EVERY targeted membership is individually allowed — the AND-reduce
 * mirrors the legacy MembershipMatcher. Here the only grant for `addMember`
 * comes from the project schema's `manage` rule, gated on the subject
 * membership's `team` variable being a subset of the invoker's.
 */
describe('PermissionContext — membership AND-loop via schema manage rule', () => {
	const manageSchema = {
		...emptySchema,
		acl: {
			roles: {
				editor: {
					entities: {},
					tenant: { manage: { editor: { variables: { team: 'team' } } } },
				},
			},
		},
	} as unknown as Schema

	const project = { slug: 'webmaster' }
	const invoker = membership('editor', [{ name: 'team', values: ['eng'] }])
	const targetEng = membership('editor', [{ name: 'team', values: ['eng'] }])
	const targetOps = membership('editor', [{ name: 'team', values: ['ops'] }])

	const ctx = () => makeContext([TenantRole.PERSON], { webmaster: [invoker] }, { webmaster: manageSchema })

	test('allows when every target membership is within invoker values', async () => {
		expect(await ctx().isAllowed({ project, action: PermissionActions.PROJECT_ADD_MEMBER([targetEng]) })).toBe(true)
	})

	test('denies when any target membership is outside invoker values', async () => {
		expect(await ctx().isAllowed({ project, action: PermissionActions.PROJECT_ADD_MEMBER([targetEng, targetOps]) })).toBe(false)
	})
})

/**
 * Custom policies stored in `identity_policy` / `tenant_policy` must actually
 * authorize through `PermissionContext` (the whole point of the engine), and
 * an explicit `deny` must win over a built-in allow.
 */
describe('PermissionContext — custom policy assignments', () => {
	test('custom allow policy grants an action the role lacks', async () => {
		const granted = makeContext([TenantRole.LOGIN], {}, { foo: emptySchema },
			dbWithCustomPolicy([{ effect: 'allow', actions: ['tenant:project.view'], resources: ['*'] }]))
		expect(await granted.isAllowed({ action: PermissionActions.PROJECT_VIEW })).toBe(true)

		// Control: same role without the assignment is denied.
		expect(await makeContext([TenantRole.LOGIN]).isAllowed({ action: PermissionActions.PROJECT_VIEW })).toBe(false)
	})

	test('custom deny policy overrides a built-in allow (deny wins)', async () => {
		const denied = makeContext([TenantRole.SUPER_ADMIN], {}, { foo: emptySchema },
			dbWithCustomPolicy([{ effect: 'deny', actions: ['tenant:project.view'], resources: ['*'] }]))
		expect(await denied.isAllowed({ action: PermissionActions.PROJECT_VIEW })).toBe(false)

		// Control: super_admin without the deny is allowed.
		expect(await makeContext([TenantRole.SUPER_ADMIN]).isAllowed({ action: PermissionActions.PROJECT_VIEW })).toBe(true)
	})
})
