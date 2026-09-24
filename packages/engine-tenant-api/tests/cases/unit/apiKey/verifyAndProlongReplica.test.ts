import { expect, test } from 'bun:test'
import {
	ApiKey,
	ApiKeyManager,
	ApiKeyService,
	AuthLogService,
	AuthPolicyResolver,
	computeTokenHash,
	DatabaseContext,
	IDPClaimSyncService,
	IDPHandlerRegistry,
	IdpSessionRevalidator,
	Providers,
	VerifyErrorCode,
} from '../../../../src/index.js'
import { Connection } from '@contember/database'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { emptySchema } from '@contember/schema-utils'

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

const selectIdpSession = (rows: Record<string, unknown>[]): ExpectedQuery => ({
	sql:
		`select "idp_session"."id", "idp_session"."identity_provider_id", "idp_session"."idp_session_id", "idp_session"."tokens", "idp_session"."tokens_version", "idp_session"."idp_expires_at", "idp_session"."token_obtained_at", "idp_session"."last_validated_at", "idp_session"."created_at", "identity_provider"."type" as "provider_type", "identity_provider"."configuration" as "provider_configuration", "identity_provider"."disabled_at" as "provider_disabled_at" from "tenant"."idp_session" inner join "tenant"."identity_provider" as "identity_provider" on "idp_session"."identity_provider_id" = "identity_provider"."id" where "api_key_id" = ?`,
	parameters: ['api-key-id'],
	response: { rows },
})

const disableUpdate: ExpectedQuery = {
	sql: `update "tenant"."api_key" set "disabled_at" = ? where "id" = ?`,
	parameters: [(val: unknown) => val instanceof Date, 'api-key-id'],
	response: { rowCount: 1 },
}

const authLogInsert: ExpectedQuery = {
	sql:
		`insert into "tenant"."person_auth_log" ("id", "invoked_by_id", "person_id", "type", "success", "error_code", "identity_provider_id", "metadata", "event_data") values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	response: { rowCount: 1 },
}

const createDbContext = (connection: Connection.ConnectionType) =>
	new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)

const verify = async (primary: Connection.ConnectionType, replica: Connection.ConnectionType, idpSessionRevalidator?: IdpSessionRevalidator) => {
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService(), undefined, idpSessionRevalidator)
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

test('a key found only on the primary reads its IdP session from the primary', async () => {
	const disabledIdpSession = {
		id: 'idp-session-id',
		identity_provider_id: 'idp-id',
		idp_session_id: null,
		tokens: null,
		tokens_version: null,
		idp_expires_at: null,
		token_obtained_at: NOW,
		last_validated_at: NOW,
		created_at: NOW,
		provider_type: 'oidc',
		provider_configuration: { revalidation: { enabled: true } },
		provider_disabled_at: NOW,
	}
	const primary = createConnectionMock([selectByToken([apiKeyRow]), selectIdpSession([disabledIdpSession]), disableUpdate, authLogInsert])
	const replica = createConnectionMock([selectByToken([]), selectIdpSession([])])
	const logHandler = new TestLoggerHandler()
	const idpSessionRevalidator = new IdpSessionRevalidator(
		new IDPHandlerRegistry(),
		new IDPClaimSyncService({ getSchema: () => Promise.resolve(emptySchema) }),
		createLogger(logHandler),
	)

	const response = await verify(primary, replica, idpSessionRevalidator)
	expect(response.ok).toBe(false)
	if (!response.ok) {
		expect(response.error).toBe(VerifyErrorCode.DISABLED)
	}
	// The revocation audit entry is best-effort and only logged on failure.
	expect(logHandler.messages).toEqual([])
})
