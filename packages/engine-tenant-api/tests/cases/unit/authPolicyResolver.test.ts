import { describe, expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { AuthPolicyResolver, DatabaseContext, Providers } from '../../../src'
import PostgresInterval from 'postgres-interval'

const NOW = new Date('2026-05-21T12:00:00.000Z')
const IDENTITY_ID = '123e4567-e89b-12d3-a456-000000000001'
const PROJECT_ID = '123e4567-e89b-12d3-a456-0000000000aa'

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
	hash: value => Buffer.from(value.toString()),
}

const makeDb = (queries: ExpectedQuery[]) => {
	const connection = createConnectionMock(queries)
	return new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)
}

const POLICIES_SQL = `select *  from "tenant"."auth_policy"`
const PROJECT_ROLES_SQL = `select "project_id", "role" from "tenant"."project_membership" where "identity_id" = ?`

const policyRow = (overrides: Record<string, unknown>) => ({
	id: 'p',
	scope: 'global',
	project_id: null,
	roles: [],
	mfa_required: null,
	token_expiration: null,
	idle_timeout: null,
	remember_me_allowed: null,
	created_at: NOW,
	updated_at: NOW,
	...overrides,
})

describe('AuthPolicyResolver', () => {
	test('no policies → inert baseline, skips the project-roles query', async () => {
		const queries: ExpectedQuery[] = [
			{ sql: POLICIES_SQL, parameters: [], response: { rows: [] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, ['someRole'])
		expect(result).toEqual({ mfaRequired: false, tokenExpiration: null, idleTimeout: null, rememberMeAllowed: null })
		expect(queries).toHaveLength(0)
	})

	test('global match: policy roles intersect global roles → mfaRequired', async () => {
		const queries: ExpectedQuery[] = [
			{ sql: POLICIES_SQL, parameters: [], response: { rows: [policyRow({ scope: 'global', roles: ['admin'], mfa_required: true })] } },
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, ['admin'])
		expect(result.mfaRequired).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('global no-match: disjoint roles → mfaRequired false', async () => {
		const queries: ExpectedQuery[] = [
			{ sql: POLICIES_SQL, parameters: [], response: { rows: [policyRow({ scope: 'global', roles: ['admin'], mfa_required: true })] } },
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, ['editor'])
		expect(result.mfaRequired).toBe(false)
	})

	test('project match: policy project_id + role intersects a membership', async () => {
		const queries: ExpectedQuery[] = [
			{
				sql: POLICIES_SQL,
				parameters: [],
				response: { rows: [policyRow({ scope: 'project', project_id: PROJECT_ID, roles: ['editor'], mfa_required: true })] },
			},
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [{ project_id: PROJECT_ID, role: 'editor' }] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, [])
		expect(result.mfaRequired).toBe(true)
	})

	test('project no-match: same role but a different project does not match', async () => {
		const queries: ExpectedQuery[] = [
			{
				sql: POLICIES_SQL,
				parameters: [],
				response: { rows: [policyRow({ scope: 'project', project_id: PROJECT_ID, roles: ['editor'], mfa_required: true })] },
			},
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [{ project_id: 'other-project', role: 'editor' }] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, [])
		expect(result.mfaRequired).toBe(false)
	})

	test('OR aggregation: one matched row with mfa_required wins over a non-requiring one', async () => {
		const queries: ExpectedQuery[] = [
			{
				sql: POLICIES_SQL,
				parameters: [],
				response: {
					rows: [
						policyRow({ scope: 'global', roles: ['a'], mfa_required: false }),
						policyRow({ scope: 'global', roles: ['b'], mfa_required: true }),
					],
				},
			},
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, ['a', 'b'])
		expect(result.mfaRequired).toBe(true)
	})

	test('strictest session aggregation: min interval, AND remember-me', async () => {
		const queries: ExpectedQuery[] = [
			{
				sql: POLICIES_SQL,
				parameters: [],
				response: {
					rows: [
						policyRow({
							scope: 'global',
							roles: ['a'],
							token_expiration: PostgresInterval('02:00:00'),
							idle_timeout: PostgresInterval('00:30:00'),
							remember_me_allowed: true,
						}),
						policyRow({
							scope: 'global',
							roles: ['b'],
							token_expiration: PostgresInterval('01:00:00'),
							idle_timeout: PostgresInterval('00:45:00'),
							remember_me_allowed: false,
						}),
					],
				},
			},
			{ sql: PROJECT_ROLES_SQL, parameters: [IDENTITY_ID], response: { rows: [] } },
		]
		const db = makeDb(queries)
		const result = await new AuthPolicyResolver().resolveForIdentity(db, IDENTITY_ID, ['a', 'b'])
		// shortest token_expiration (1h) and idle_timeout (30m), remember-me ANDed to false
		expect(result.tokenExpiration && PostgresInterval(result.tokenExpiration as unknown as string)).toBeDefined()
		expect((result.tokenExpiration as any).hours).toBe(1)
		expect((result.idleTimeout as any).minutes).toBe(30)
		expect(result.rememberMeAllowed).toBe(false)
	})
})
