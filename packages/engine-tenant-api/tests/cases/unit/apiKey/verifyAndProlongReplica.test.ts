import { expect, test } from 'bun:test'
import {
	ApiKey,
	ApiKeyManager,
	ApiKeyService,
	AuthLogService,
	AuthPolicyResolver,
	computeTokenHash,
	DatabaseContext,
	Providers,
	VerifyErrorCode,
} from '../../../../src/index.js'
import { Connection } from '@contember/database'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'

const TOKEN = '0000000000000000000000000000000000000000'
const NOW = new Date('2026-05-21T12:00:00Z')

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: () => Promise.resolve(Buffer.alloc(0)),
	uuid: () => '00000000-0000-0000-0000-000000000000',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: () => Buffer.alloc(0),
}

const apiKeyRow = {
	id: 'api-key-id',
	type: ApiKey.Type.SESSION,
	identity_id: 'identity-id',
	disabled_at: null,
	expires_at: new Date(NOW.getTime() + 30 * 60_000),
	roles: ['editor'],
	expiration: 30,
	person_id: 'person-id',
	last_ip: null,
	last_user_agent: null,
	last_used_at: null,
	trust_forwarded_info: false,
	issued_at: null,
	idle_timeout: null,
	max_expires_at: null,
}

const selectByToken = (rows: (typeof apiKeyRow)[]): ExpectedQuery => ({
	sql:
		`select "api_key"."id", "api_key"."type", "api_key"."identity_id", "api_key"."disabled_at", "api_key"."expires_at", "identity"."roles", "api_key"."expiration", "person"."id" as "person_id", "api_key"."last_ip", "api_key"."last_user_agent", "api_key"."last_used_at", "api_key"."trust_forwarded_info", "api_key"."issued_at", "api_key"."idle_timeout", "api_key"."max_expires_at" from "tenant"."api_key" inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id" left join "tenant"."person" as "person" on "person"."identity_id" = "identity"."id" where "token_hash" = ?`,
	parameters: [computeTokenHash(TOKEN)],
	response: { rows },
})

// The prolong UPDATE runs detached on the primary once a key is accepted.
const prolongUpdate: ExpectedQuery = {
	sql: `update "tenant"."api_key" set "expires_at" = ? where "id" = ?`,
	parameters: [(val: unknown) => val instanceof Date, 'api-key-id'],
	response: { rowCount: 1 },
}

const createDbContext = (connection: Connection.ConnectionType) =>
	new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)

const verify = async (primary: Connection.ConnectionType, replica: Connection.ConnectionType) => {
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService())
	const response = await manager.verifyAndProlong(createDbContext(primary), createDbContext(replica), TOKEN)
	// Let the setImmediate-scheduled prolong run before the connection mocks are torn down.
	await new Promise(resolve => setImmediate(resolve))
	return response
}

test('a key not yet replicated is found on the primary', async () => {
	const primary = createConnectionMock([selectByToken([apiKeyRow]), prolongUpdate])
	const replica = createConnectionMock([selectByToken([])])

	const response = await verify(primary, replica)
	expect(response.ok).toBe(true)
	if (response.ok) {
		expect(response.result.apiKeyId).toBe('api-key-id')
	}
})

test('a key found on the replica does not query the primary', async () => {
	const primary = createConnectionMock([prolongUpdate])
	const replica = createConnectionMock([selectByToken([apiKeyRow])])

	const response = await verify(primary, replica)
	expect(response.ok).toBe(true)
})

test('a key missing on both the replica and the primary is not found', async () => {
	const primary = createConnectionMock([selectByToken([])])
	const replica = createConnectionMock([selectByToken([])])

	const response = await verify(primary, replica)
	expect(response.ok).toBe(false)
	if (!response.ok) {
		expect(response.error).toBe(VerifyErrorCode.NOT_FOUND)
	}
})

test('without a replica, a missing key is looked up only once', async () => {
	const connection = createConnectionMock([selectByToken([])])

	const response = await verify(connection, connection)
	expect(response.ok).toBe(false)
})
