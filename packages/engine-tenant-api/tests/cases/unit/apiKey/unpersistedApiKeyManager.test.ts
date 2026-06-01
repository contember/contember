import { expect, test } from 'bun:test'
import {
	ApiKeyManager,
	ApiKeyService,
	AuthLogService,
	AuthPolicyResolver,
	computeTokenHash,
	DatabaseContext,
	Providers,
	TenantRole,
	UNPERSISTED_ROOT_IDENTITY_ID,
	UnpersistedApiKeyManager,
} from '../../../../src/index.js'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'

const baseProviders: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => new Date('2026-05-12T12:00:00Z'),
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => '00000000-0000-0000-0000-000000000000',
	encryptionEnabled: false,
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	hash: () => Buffer.alloc(0),
}

test('verify returns null when no root tokens are configured', () => {
	const manager = new UnpersistedApiKeyManager()
	expect(manager.isEmpty).toBe(true)
	expect(manager.verify('anything')).toBeNull()
})

test('verify resolves a configured plain root token to super-admin', () => {
	const manager = UnpersistedApiKeyManager.createForRootTokens({ tokens: ['my-secret-root-token'] })
	expect(manager.isEmpty).toBe(false)

	const result = manager.verify('my-secret-root-token')
	expect(result).not.toBeNull()
	expect(result!.identityId).toBe(UNPERSISTED_ROOT_IDENTITY_ID)
	expect(result!.roles).toEqual([TenantRole.SUPER_ADMIN])
	expect(result!.personId).toBeNull()
})

test('verify resolves a configured root token hash to super-admin', () => {
	const tokenHash = computeTokenHash('hashed-root-token')
	const manager = UnpersistedApiKeyManager.createForRootTokens({ tokenHashes: [tokenHash] })

	const result = manager.verify('hashed-root-token')
	expect(result).not.toBeNull()
	expect(result!.identityId).toBe(UNPERSISTED_ROOT_IDENTITY_ID)
	expect(result!.roles).toEqual([TenantRole.SUPER_ADMIN])
})

test('verify accepts upper-case token hashes', () => {
	const tokenHash = computeTokenHash('case-insensitive').toUpperCase()
	const manager = UnpersistedApiKeyManager.createForRootTokens({ tokenHashes: [tokenHash] })
	expect(manager.verify('case-insensitive')).not.toBeNull()
})

test('verify returns null for a non-matching token', () => {
	const manager = UnpersistedApiKeyManager.createForRootTokens({ tokens: ['correct'] })
	expect(manager.verify('wrong')).toBeNull()
})

test('createForRootTokens rejects malformed token hashes', () => {
	expect(() => UnpersistedApiKeyManager.createForRootTokens({ tokenHashes: ['not-a-valid-hash'] })).toThrow()
})

test('createForRootTokens ignores empty entries', () => {
	const manager = UnpersistedApiKeyManager.createForRootTokens({ tokens: ['', 'real'], tokenHashes: [''] })
	expect(manager.verify('real')).not.toBeNull()
	expect(manager.verify('')).toBeNull()
})

const createDbContext = (expectedQueries: ExpectedQuery[]) => {
	const connection = createConnectionMock(expectedQueries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	return new DatabaseContext(client, baseProviders)
}

test('verifyAndProlong short-circuits an unpersisted root token without touching the database', async () => {
	const unpersisted = UnpersistedApiKeyManager.createForRootTokens({ tokens: ['unpersisted-root'] })
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService(), unpersisted)

	// No expected queries: any DB access would throw.
	const dbContext = createDbContext([])
	const readDbContext = createDbContext([])

	const response = await manager.verifyAndProlong(dbContext, readDbContext, 'unpersisted-root')
	expect(response.ok).toBe(true)
	if (response.ok) {
		expect(response.result.identityId).toBe(UNPERSISTED_ROOT_IDENTITY_ID)
		expect(response.result.roles).toEqual([TenantRole.SUPER_ADMIN])
	}
})

test('verifyAndProlong falls through to the database for a non-matching token', async () => {
	const unpersisted = UnpersistedApiKeyManager.createForRootTokens({ tokens: ['unpersisted-root'] })
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService(), unpersisted)

	const tokenHash = computeTokenHash('some-db-token')
	const readDbContext = createDbContext([
		{
			sql:
				'select "api_key"."id", "api_key"."type", "api_key"."identity_id", "api_key"."disabled_at", "api_key"."expires_at", "identity"."roles", "api_key"."expiration", "person"."id" as "person_id", "api_key"."last_ip", "api_key"."last_user_agent", "api_key"."last_used_at", "api_key"."trust_forwarded_info", "api_key"."issued_at", "api_key"."idle_timeout", "api_key"."max_expires_at" from "tenant"."api_key" inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id" left join "tenant"."person" as "person" on "person"."identity_id" = "identity"."id" where "token_hash" = ?',
			parameters: [tokenHash],
			response: { rows: [] },
		},
	])
	const dbContext = createDbContext([])

	const response = await manager.verifyAndProlong(dbContext, readDbContext, 'some-db-token')
	expect(response.ok).toBe(false)
})
