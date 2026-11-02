import { describe, expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { AuthCredential, WorkloadAssumeRule } from '@contember/engine-tenant-api'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../../../src/index.js'
import { HttpErrorResponse } from '../../../src/common/HttpResponse.js'
import { createMock } from '../../utils.js'

const identityId = 'd4141336-6512-41ef-a25a-374de35a2806'
const workloadCredential: AuthCredential = { type: 'workload_trust', trustId: 'trust-1', trustSlug: 'sites-sync', tokenRef: 'jti-1' }
const apiKeyCredential: AuthCredential = { type: 'api_key', id: 'api-key-1' }

const site: Acl.EntityVariable = { type: Acl.VariableType.entity, entityName: 'Site' }

const acl: Acl.Schema = {
	roles: {
		sync: {
			variables: { site },
			entities: {},
			// Must be ignored for a workload credential: the envelope is the only authority.
			content: { assumeMembership: true },
		},
		editor: { variables: { site }, entities: {} },
		reader: { variables: { site }, entities: {} },
		owner: {
			variables: { site, identity: { type: Acl.VariableType.predefined, value: 'identityID' } },
			entities: {},
		},
		translator: {
			variables: { site, lang: { type: Acl.VariableType.condition, fallback: { always: true } } },
			entities: {},
		},
	},
}

const syncMembership: Acl.Membership = { role: 'sync', variables: [{ name: 'site', values: ['blog'] }] }

const createResolver = ({ memberships = [syncMembership], rules = [] }: {
	memberships?: readonly Acl.Membership[]
	rules?: readonly WorkloadAssumeRule[]
} = {}) => {
	const ruleFetches: { projectSlug: string; trustId: string }[] = []
	const resolver = new ProjectMembershipResolver(
		false,
		createMock<ProjectMembershipFetcher>({
			fetchMemberships: () => Promise.resolve(memberships),
			fetchWorkloadAssumeRules: (projectSlug, trustId) => {
				ruleFetches.push({ projectSlug, trustId })
				return Promise.resolve(rules)
			},
		}),
	)
	return { resolver, ruleFetches }
}

const resolve = (
	resolver: ProjectMembershipResolver,
	assumed: readonly Acl.Membership[] | null,
	{ credential = workloadCredential, schema = acl }: { credential?: AuthCredential; schema?: Acl.Schema } = {},
) =>
	resolver.resolveMemberships({
		request: {
			body: assumed === null ? {} : { assumeMembership: { memberships: assumed } },
			get: () => '',
		},
		acl: schema,
		projectSlug: 'sites',
		identity: { identityId, roles: [], credential },
	})

const expectForbidden = async (promise: Promise<unknown>) => {
	const error = await promise.then(() => undefined, (e: unknown) => e)
	if (!(error instanceof HttpErrorResponse)) {
		throw new Error(`Expected an HttpErrorResponse, got ${String(error)}`)
	}
	expect(error.code).toBe(403)
}

describe('workload assume-membership envelope', () => {
	test('an assumption within the rule replaces the stored memberships', async () => {
		const { resolver, ruleFetches } = createResolver({
			rules: [{ membership: syncMembership, rule: { editor: { variables: { site: 'site' } } } }],
		})
		const result = await resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['blog'] }] }])
		expect(result.effective).toStrictEqual([{ role: 'editor', variables: [{ name: 'site', condition: { in: ['blog'] } }] }])
		expect(result.fetched).toStrictEqual([syncMembership])
		expect(ruleFetches).toStrictEqual([{ projectSlug: 'sites', trustId: 'trust-1' }])
	})

	test('without a request to assume, the stored memberships apply and no rule is read', async () => {
		const { resolver, ruleFetches } = createResolver()
		const result = await resolve(resolver, null)
		expect(result.effective).toStrictEqual([{ role: 'sync', variables: [{ name: 'site', condition: { in: ['blog'] } }] }])
		expect(ruleFetches).toHaveLength(0)
	})

	test('no rules means no assumption, even when the schema role allows it', async () => {
		const { resolver } = createResolver({ rules: [] })
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['blog'] }] }]))
	})

	test('values outside the source membership are refused', async () => {
		const { resolver } = createResolver({
			rules: [{ membership: syncMembership, rule: { editor: { variables: { site: 'site' } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['shop'] }] }]))
	})

	test('an omitted variable is refused instead of passing vacuously', async () => {
		const { resolver } = createResolver({
			rules: [{ membership: syncMembership, rule: { editor: { variables: { site: 'site' } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [] }]))
	})

	test('an empty value list is refused', async () => {
		const { resolver } = createResolver({
			rules: [{ membership: syncMembership, rule: { editor: { variables: { site: 'site' } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: [] }] }]))
	})

	test('an unbounded rule still needs every variable supplied', async () => {
		const { resolver } = createResolver({ rules: [{ membership: syncMembership, rule: { editor: { variables: true } } }] })
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [] }]))
		const result = await resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['anything'] }] }])
		expect(result.effective).toStrictEqual([{ role: 'editor', variables: [{ name: 'site', condition: { in: ['anything'] } }] }])
	})

	test('a variable with a schema fallback must be supplied, so the fallback cannot widen the grant', async () => {
		const { resolver } = createResolver({
			rules: [{ membership: syncMembership, rule: { translator: { variables: { site: 'site', lang: true } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'translator', variables: [{ name: 'site', values: ['blog'] }] }]))
	})

	test('a variable the rule predates (schema drift) is refused whether supplied or not', async () => {
		const { resolver } = createResolver({
			rules: [{ membership: syncMembership, rule: { translator: { variables: { site: 'site' } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'translator', variables: [{ name: 'site', values: ['blog'] }] }]))
		await expectForbidden(resolve(resolver, [{
			role: 'translator',
			variables: [{ name: 'site', values: ['blog'] }, { name: 'lang', values: [JSON.stringify({ eq: 'cs' })] }],
		}]))
	})

	test('a rule never borrows values from a sibling membership', async () => {
		const readerMembership: Acl.Membership = { role: 'reader', variables: [{ name: 'site', values: ['blog', 'shop'] }] }
		const { resolver } = createResolver({
			memberships: [syncMembership, readerMembership],
			rules: [
				{ membership: syncMembership, rule: { editor: { variables: { site: 'site' } } } },
				{ membership: readerMembership, rule: { reader: { variables: { site: 'site' } } } },
			],
		})
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['shop'] }] }]))
		const result = await resolve(resolver, [{ role: 'reader', variables: [{ name: 'site', values: ['shop'] }] }])
		expect(result.effective.map(it => it.role)).toStrictEqual(['reader'])
	})

	test('a caller-supplied predefined variable is refused', async () => {
		const { resolver } = createResolver({ rules: [{ membership: syncMembership, rule: { owner: { variables: true } } }] })
		await expectForbidden(resolve(resolver, [{
			role: 'owner',
			variables: [{ name: 'site', values: ['blog'] }, { name: 'identity', values: ['00000000-0000-0000-0000-000000000001'] }],
		}]))
	})

	test('a predefined variable derives from the trust identity', async () => {
		const { resolver } = createResolver({ rules: [{ membership: syncMembership, rule: { owner: { variables: { site: 'site' } } } }] })
		const result = await resolve(resolver, [{ role: 'owner', variables: [{ name: 'site', values: ['blog'] }] }])
		expect(result.effective).toStrictEqual([{
			role: 'owner',
			variables: [{ name: 'site', condition: { in: ['blog'] } }, { name: 'identity', condition: { in: [identityId] } }],
		}])
	})

	test('a source membership whose role left the schema grants nothing', async () => {
		const goneMembership: Acl.Membership = { role: 'gone', variables: [{ name: 'site', values: ['blog'] }] }
		const { resolver } = createResolver({
			memberships: [goneMembership],
			rules: [{ membership: goneMembership, rule: { editor: { variables: { site: 'site' } } } }],
		})
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['blog'] }] }]))
	})
})

describe('api key assume-membership', () => {
	test('a stored membership whose role left the schema is skipped instead of failing', async () => {
		const { resolver, ruleFetches } = createResolver({
			memberships: [{ role: 'gone', variables: [] }, syncMembership],
		})
		const result = await resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['blog'] }] }], { credential: apiKeyCredential })
		expect(result.effective.map(it => it.role)).toStrictEqual(['editor'])
		expect(ruleFetches).toHaveLength(0)
	})

	test('a stored membership whose role left the schema grants nothing', async () => {
		const { resolver } = createResolver({ memberships: [{ role: 'gone', variables: [] }] })
		await expectForbidden(resolve(resolver, [{ role: 'editor', variables: [{ name: 'site', values: ['blog'] }] }], { credential: apiKeyCredential }))
	})
})
