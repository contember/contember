import { describe, expect, test } from 'bun:test'
import {
	AssignPolicyMutationResolver,
	BuiltinPolicyQueryResolver,
	CreatePolicyMutationResolver,
	DeletePolicyMutationResolver,
	PolicyQueryResolver,
	RevokePolicyMutationResolver,
	UpdatePolicyMutationResolver,
} from '../../../src/resolvers'
import { BUILTIN_POLICIES, PolicyDto, PolicyNotFoundError, PolicyService, PolicyValidationError } from '../../../src/model/policy'
import { TenantResolverContext } from '../../../src/resolvers/TenantResolverContext'

const samplePolicy: PolicyDto = {
	id: 'policy-1',
	slug: 'auditor',
	label: 'Auditor',
	description: null,
	document: { version: '1', statements: [{ effect: 'allow', actions: ['tenant:person.view'], resources: ['*'] }] },
	version: 1,
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
}

class StubService extends PolicyService {
	public lastCall: { method: string; args: unknown[] } | null = null
	constructor(
		private readonly impl: Partial<{
			list: () => Promise<PolicyDto[]>
			getBySlug: (slug: string) => Promise<PolicyDto | null>
			create: () => Promise<{ id: string }>
			update: () => Promise<{ updated: boolean }>
			delete: () => Promise<{ deleted: boolean }>
			assign: () => Promise<void>
			revoke: () => Promise<{ revoked: boolean }>
		}>,
	) {
		super()
	}
	async list(): Promise<PolicyDto[]> {
		this.lastCall = { method: 'list', args: [] }
		return this.impl.list ? this.impl.list() : []
	}
	async getBySlug(_db: any, slug: string): Promise<PolicyDto | null> {
		this.lastCall = { method: 'getBySlug', args: [slug] }
		return this.impl.getBySlug ? this.impl.getBySlug(slug) : null
	}
	async create(_db: any, input: any): Promise<{ id: string }> {
		this.lastCall = { method: 'create', args: [input] }
		return this.impl.create ? this.impl.create() : { id: 'new-id' }
	}
	async update(_db: any, slug: string, input: any): Promise<{ updated: boolean }> {
		this.lastCall = { method: 'update', args: [slug, input] }
		if (!this.impl.update) throw new PolicyNotFoundError(slug)
		return this.impl.update()
	}
	async delete(_db: any, slug: string): Promise<{ deleted: boolean }> {
		this.lastCall = { method: 'delete', args: [slug] }
		return this.impl.delete ? this.impl.delete() : { deleted: false }
	}
	async assign(_db: any, identityId: string, policySlug: string, tags: Record<string, unknown>): Promise<void> {
		this.lastCall = { method: 'assign', args: [identityId, policySlug, tags] }
		if (this.impl.assign) {
			await this.impl.assign()
		}
	}
	async revoke(_db: any, identityId: string, policySlug: string): Promise<{ revoked: boolean }> {
		this.lastCall = { method: 'revoke', args: [identityId, policySlug] }
		return this.impl.revoke ? this.impl.revoke() : { revoked: false }
	}
}

const makeContext = (overrides: {
	allowed?: boolean
	identityId?: string
	identities?: { id: string }[]
} = {}): TenantResolverContext => {
	const identities = overrides.identities ?? [{ id: 'target-identity' }]
	return {
		identity: { id: overrides.identityId ?? 'caller-id', roles: ['super_admin'] } as any,
		permissionContext: {} as any,
		apiKeyId: 'api-key-id',
		isAllowed: async () => overrides.allowed !== false,
		requireAccess: async () => {
			if (overrides.allowed === false) {
				const { ForbiddenError } = await import('@contember/graphql-utils')
				throw new ForbiddenError('forbidden')
			}
		},
		db: {
			queryHandler: {
				fetch: async (q: any) => {
					if (q.constructor.name === 'IdentityQuery') return identities
					return []
				},
			},
			commandBus: { execute: async () => {} },
		} as any,
		logger: { error: () => {}, info: () => {} } as any,
		logAuthAction: async () => {},
	}
}

describe('CreatePolicyMutationResolver', () => {
	test('happy path returns ok + created policy', async () => {
		const svc = new StubService({
			getBySlug: async slug => (svc.lastCall?.method === 'getBySlug' && (svc.lastCall.args[0] === 'auditor' && (svc.lastCall.args as any[]).length === 1)
				? samplePolicy
				: null),
			create: async () => ({ id: 'policy-1' }),
		})
		// First getBySlug returns null (no existing), second returns samplePolicy. Simulate via call count.
		let calls = 0
		svc.getBySlug = async (_db, slug) => {
			calls += 1
			return calls === 1 ? null : samplePolicy
		}
		const resolver = new CreatePolicyMutationResolver(svc)
		const res = await resolver.createPolicy(
			{},
			{
				input: {
					slug: 'auditor',
					document: { version: '1', statements: [{ effect: 'allow', actions: ['tenant:person.view'] }] },
				},
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(true)
		expect(res.result?.policy.slug).toBe('auditor')
	})

	test('returns SLUG_ALREADY_EXISTS when slug taken', async () => {
		const svc = new StubService({})
		svc.getBySlug = async () => samplePolicy
		const resolver = new CreatePolicyMutationResolver(svc)
		const res = await resolver.createPolicy(
			{},
			{
				input: { slug: 'auditor', document: { statements: [] } },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('SLUG_ALREADY_EXISTS')
	})

	test('maps PolicyValidationError to INVALID_DOCUMENT', async () => {
		const svc = new StubService({})
		svc.getBySlug = async () => null
		svc.create = async () => {
			throw new PolicyValidationError('bad statement')
		}
		const resolver = new CreatePolicyMutationResolver(svc)
		const res = await resolver.createPolicy(
			{},
			{
				input: { slug: 'auditor', document: { statements: [] } },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('INVALID_DOCUMENT')
	})

	test('reserved-slug error maps to SLUG_RESERVED', async () => {
		const svc = new StubService({})
		svc.getBySlug = async () => null
		svc.create = async () => {
			throw new PolicyValidationError('Slug prefix "builtin:" is reserved')
		}
		const resolver = new CreatePolicyMutationResolver(svc)
		const res = await resolver.createPolicy(
			{},
			{
				input: { slug: 'builtin:foo', document: { statements: [] } },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('SLUG_RESERVED')
	})

	test('requireAccess failure propagates as ForbiddenError', async () => {
		const svc = new StubService({})
		const resolver = new CreatePolicyMutationResolver(svc)
		await expect(
			resolver.createPolicy(
				{},
				{
					input: { slug: 'auditor', document: { statements: [] } },
				},
				makeContext({ allowed: false }),
				{} as any,
			),
		).rejects.toThrow()
	})
})

describe('UpdatePolicyMutationResolver', () => {
	test('happy path', async () => {
		const svc = new StubService({ update: async () => ({ updated: true }) })
		svc.getBySlug = async () => samplePolicy
		const resolver = new UpdatePolicyMutationResolver(svc)
		const res = await resolver.updatePolicy({}, { slug: 'auditor', input: { label: 'New label' } }, makeContext(), {} as any)
		expect(res.ok).toBe(true)
		expect(res.result?.policy.slug).toBe('auditor')
	})

	test('not-found returns POLICY_NOT_FOUND', async () => {
		const svc = new StubService({})
		svc.update = async () => {
			throw new PolicyNotFoundError('missing')
		}
		const resolver = new UpdatePolicyMutationResolver(svc)
		const res = await resolver.updatePolicy({}, { slug: 'missing', input: {} }, makeContext(), {} as any)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('POLICY_NOT_FOUND')
	})

	test('invalid doc returns INVALID_DOCUMENT', async () => {
		const svc = new StubService({})
		svc.update = async () => {
			throw new PolicyValidationError('bad')
		}
		const resolver = new UpdatePolicyMutationResolver(svc)
		const res = await resolver.updatePolicy(
			{},
			{
				slug: 'auditor',
				input: { document: { statements: [] } },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('INVALID_DOCUMENT')
	})
})

describe('DeletePolicyMutationResolver', () => {
	test('happy path', async () => {
		const svc = new StubService({ delete: async () => ({ deleted: true }) })
		const resolver = new DeletePolicyMutationResolver(svc)
		const res = await resolver.deletePolicy({}, { slug: 'auditor' }, makeContext(), {} as any)
		expect(res.ok).toBe(true)
	})

	test('not-found', async () => {
		const svc = new StubService({ delete: async () => ({ deleted: false }) })
		const resolver = new DeletePolicyMutationResolver(svc)
		const res = await resolver.deletePolicy({}, { slug: 'missing' }, makeContext(), {} as any)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('POLICY_NOT_FOUND')
	})
})

describe('AssignPolicyMutationResolver', () => {
	test('happy path', async () => {
		const svc = new StubService({ assign: async () => {} })
		svc.getBySlug = async () => samplePolicy
		const resolver = new AssignPolicyMutationResolver(svc)
		const res = await resolver.assignPolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'auditor',
				tags: { team: 'eng' },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(true)
		expect(svc.lastCall?.method).toBe('assign')
		expect(svc.lastCall?.args).toEqual(['target-identity', 'auditor', { team: 'eng' }])
	})

	test('unknown identity returns IDENTITY_NOT_FOUND without touching policy service', async () => {
		const svc = new StubService({})
		let assignCalled = false
		svc.assign = async () => {
			assignCalled = true
		}
		const resolver = new AssignPolicyMutationResolver(svc)
		const res = await resolver.assignPolicy(
			{},
			{
				identityId: 'no-such',
				policySlug: 'auditor',
				tags: {},
			},
			makeContext({ identities: [] }),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('IDENTITY_NOT_FOUND')
		expect(assignCalled).toBe(false)
	})

	test('PolicyNotFoundError maps to POLICY_NOT_FOUND', async () => {
		const svc = new StubService({})
		svc.assign = async () => {
			throw new PolicyNotFoundError('auditor')
		}
		const resolver = new AssignPolicyMutationResolver(svc)
		const res = await resolver.assignPolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'auditor',
				tags: {},
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('POLICY_NOT_FOUND')
	})

	test('PolicyValidationError on tags maps to INVALID_TAGS', async () => {
		const svc = new StubService({})
		svc.assign = async () => {
			throw new PolicyValidationError('template syntax in tag')
		}
		const resolver = new AssignPolicyMutationResolver(svc)
		const res = await resolver.assignPolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'auditor',
				tags: { team: '${identity.id}' },
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('INVALID_TAGS')
	})
})

describe('RevokePolicyMutationResolver', () => {
	test('happy path', async () => {
		const svc = new StubService({ revoke: async () => ({ revoked: true }) })
		svc.getBySlug = async () => samplePolicy
		const resolver = new RevokePolicyMutationResolver(svc)
		const res = await resolver.revokePolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'auditor',
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(true)
	})

	test('unknown policy returns POLICY_NOT_FOUND', async () => {
		const svc = new StubService({})
		svc.getBySlug = async () => null
		const resolver = new RevokePolicyMutationResolver(svc)
		const res = await resolver.revokePolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'missing',
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('POLICY_NOT_FOUND')
	})

	test('not-assigned returns NOT_ASSIGNED', async () => {
		const svc = new StubService({ revoke: async () => ({ revoked: false }) })
		svc.getBySlug = async () => samplePolicy
		const resolver = new RevokePolicyMutationResolver(svc)
		const res = await resolver.revokePolicy(
			{},
			{
				identityId: 'target-identity',
				policySlug: 'auditor',
			},
			makeContext(),
			{} as any,
		)
		expect(res.ok).toBe(false)
		expect(res.error?.code).toBe('NOT_ASSIGNED')
	})
})

describe('PolicyQueryResolver', () => {
	test('list returns mapped policies', async () => {
		const svc = new StubService({ list: async () => [samplePolicy] })
		const resolver = new PolicyQueryResolver(svc)
		const res = await resolver.policies({}, {}, makeContext(), {} as any)
		expect(res).toHaveLength(1)
		expect(res[0].slug).toBe('auditor')
	})

	test('policy by slug returns null when missing', async () => {
		const svc = new StubService({})
		svc.getBySlug = async () => null
		const resolver = new PolicyQueryResolver(svc)
		const res = await resolver.policy({}, { slug: 'missing' }, makeContext(), {} as any)
		expect(res).toBeNull()
	})
})

describe('BuiltinPolicyQueryResolver', () => {
	test('returns BUILTIN_POLICIES list mapped to GraphQL shape', async () => {
		const resolver = new BuiltinPolicyQueryResolver()
		const res = await resolver.builtinPolicies({}, {}, makeContext(), {} as any)
		expect(res).toHaveLength(BUILTIN_POLICIES.length)
		expect(res[0]).toHaveProperty('role')
		expect(res[0].slug.startsWith('builtin:')).toBe(true)
	})
})
