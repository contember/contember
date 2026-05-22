import { expect, test } from 'bun:test'
import { ApiKeyManager, ApiKeyService, AuthLogService, AuthPolicyResolver, DatabaseContext, Providers } from '../../../../src'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import PostgresInterval from 'postgres-interval'

const IDENTITY_ID = 'identity-id'
const NOW = new Date('2026-05-21T12:00:00Z')

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => NOW,
	randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	uuid: () => '00000000-0000-0000-0000-000000000001',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: () => Buffer.alloc(0),
}

type PolicyRow = {
	id: string
	scope: 'global' | 'project'
	project_id: string | null
	roles: string[]
	mfa_required: boolean | null
	token_expiration: ReturnType<typeof PostgresInterval> | null
	idle_timeout: ReturnType<typeof PostgresInterval> | null
	remember_me_allowed: boolean | null
	created_at: Date
	updated_at: Date
}

const configQuery = (overrides: Record<string, unknown> = {}): ExpectedQuery => ({
	sql: `select *  from "tenant"."config"`,
	parameters: [],
	response: {
		rows: [{
			id: 'b65949a6-b481-40b5-a0ed-0acdb5a24cb6',
			passwordless_enabled: 'never',
			passwordless_url: null,
			passwordless_expiration: PostgresInterval('00:10:00'),
			password_min_length: 6,
			password_require_uppercase: 1,
			password_require_lowercase: 1,
			password_require_digit: 1,
			password_require_special: 0,
			password_pattern: null,
			password_check_blacklist: true,
			password_check_hibp: false,
			login_base_backoff: PostgresInterval('00:00:01'),
			login_max_backoff: PostgresInterval('00:01:00'),
			login_attempt_window: PostgresInterval('00:05:00'),
			login_reveal_user_exits: true,
			login_reveal_login_method: true,
			login_default_token_expiration: PostgresInterval('00:30:00'),
			login_max_token_expiration: PostgresInterval('12:00:00'),
			captcha_provider: null,
			captcha_secret: null,
			captcha_secret_version: null,
			captcha_threshold: null,
			rate_limit_sign_up_per_ip_limit: 0,
			rate_limit_sign_up_per_ip_window: PostgresInterval('01:00:00'),
			rate_limit_login_per_ip_limit: 0,
			rate_limit_login_per_ip_window: PostgresInterval('01:00:00'),
			rate_limit_password_reset_per_ip_limit: 0,
			rate_limit_password_reset_per_ip_window: PostgresInterval('01:00:00'),
			rate_limit_passwordless_init_per_ip_limit: 0,
			rate_limit_passwordless_init_per_ip_window: PostgresInterval('01:00:00'),
			...overrides,
		}],
	},
})

const identityQuery = (roles: string[]): ExpectedQuery => ({
	sql: `select "id", "description", "roles" from "tenant"."identity" where "id" in (?)`,
	parameters: [IDENTITY_ID],
	response: { rows: [{ id: IDENTITY_ID, description: null, roles }] },
})

const authPoliciesQuery = (rows: PolicyRow[] = []): ExpectedQuery => ({
	sql: `select *  from "tenant"."auth_policy"`,
	parameters: [],
	response: { rows },
})

const projectRolesQuery: ExpectedQuery = {
	sql: `select "project_id", "role" from "tenant"."project_membership" where "identity_id" = ?`,
	parameters: [IDENTITY_ID],
	response: { rows: [] },
}

const policy = (overrides: Partial<PolicyRow>): PolicyRow => ({
	id: 'policy-id',
	scope: 'global',
	project_id: null,
	roles: ['editor'],
	mfa_required: null,
	token_expiration: null,
	idle_timeout: null,
	remember_me_allowed: null,
	created_at: NOW,
	updated_at: NOW,
	...overrides,
})

// Captures the `type` of the session_policy_applied person_auth_log insert.
// logSessionEvent passes no personId here, so the InsertBuilder omits the
// person_id column → columns are id, invoked_by_id, type, success, metadata, event_data.
const authLogInsert = (capture: { type?: string }): ExpectedQuery => ({
	sql: `insert into  "tenant"."person_auth_log" ("id", "invoked_by_id", "type", "success", "metadata", "event_data") values  (?, ?, ?, ?, ?, ?)`,
	parameters: [
		() => true,
		() => true,
		(value: any) => {
			capture.type = value
			return true
		},
		() => true,
		() => true,
		() => true,
	],
	response: { rowCount: 1 },
})

// "non-inert" mirrors ApiKeyManager's guard: any policy field actually set.
const isPolicyApplied = (policies: PolicyRow[]): boolean =>
	policies.some(p =>
		p.mfa_required === true
		|| p.token_expiration !== null
		|| p.idle_timeout !== null
		|| p.remember_me_allowed !== null
	)

const run = async (args: {
	expiration?: number
	policies?: PolicyRow[]
	roles?: string[]
}): Promise<{ insertParams: any[]; authLog: { type?: string } }> => {
	const manager = new ApiKeyManager(new ApiKeyService(), new AuthPolicyResolver(), new AuthLogService())
	const policies = args.policies ?? []
	const queries: ExpectedQuery[] = [
		configQuery(),
		identityQuery(args.roles ?? ['editor']),
		authPoliciesQuery(policies),
	]
	if (policies.length > 0) {
		queries.push(projectRolesQuery)
	}
	const insertParams: any[] = new Array(14)
	queries.push({
		sql:
			`INSERT INTO "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at", "created_ip", "created_user_agent", "trust_forwarded_info", "issued_at", "idle_timeout", "max_expires_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		// Each positional matcher records the value and always matches.
		parameters: Array.from({ length: 14 }, (_, i) => (value: any) => {
			insertParams[i] = value
			return true
		}),
		response: { rowCount: 1 },
	})
	const authLog: { type?: string } = {}
	if (isPolicyApplied(policies)) {
		queries.push(authLogInsert(authLog))
	}
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, providers)
	await manager.createSessionApiKey(db, IDENTITY_ID, args.expiration)
	return { insertParams, authLog }
}

// INSERT column order:
// 0 id, 1 token_hash, 2 type, 3 identity_id, 4 disabled_at, 5 expires_at,
// 6 expiration, 7 created_at, 8 created_ip, 9 created_user_agent,
// 10 trust_forwarded_info, 11 issued_at, 12 idle_timeout, 13 max_expires_at
const EXPIRES_AT = 5
const EXPIRATION = 6
const ISSUED_AT = 11
const IDLE_TIMEOUT = 12
const MAX_EXPIRES_AT = 13

test('A19: no policy → identical to today (no idle_timeout / max_expires_at, default 30m window)', async () => {
	const { insertParams: params, authLog } = await run({})
	expect(params[EXPIRATION]).toBe(30)
	expect(params[EXPIRES_AT]).toEqual(new Date('2026-05-21T12:30:00Z'))
	expect(params[IDLE_TIMEOUT]).toBeNull()
	expect(params[MAX_EXPIRES_AT]).toBeNull()
	// issued_at is always set for session keys.
	expect(params[ISSUED_AT]).toEqual(NOW)
	// No policy in effect → no session_policy_applied audit (no extra insert).
	expect(authLog.type).toBeUndefined()
})

test('A19: tokenExpiration policy → max_expires_at set and initial expiry capped to the policy', async () => {
	// Client asks for 600 min, but policy caps token lifetime to 10 minutes.
	const { insertParams: params, authLog } = await run({
		expiration: 600,
		policies: [policy({ token_expiration: PostgresInterval('00:10:00') })],
	})
	expect(params[EXPIRATION]).toBe(10)
	expect(params[EXPIRES_AT]).toEqual(new Date('2026-05-21T12:10:00Z'))
	expect(params[MAX_EXPIRES_AT]).toEqual(new Date('2026-05-21T12:10:00Z'))
	// Non-inert policy applied → session_policy_applied audit fires.
	expect(authLog.type).toBe('session_policy_applied')
})

test('A19: idleTimeout policy → idle_timeout snapshotted onto the key', async () => {
	const { insertParams: params, authLog } = await run({
		policies: [policy({ idle_timeout: PostgresInterval('00:15:00') })],
	})
	// Serialized via postgres-interval's toPostgres().
	expect(params[IDLE_TIMEOUT]).toBe('15 minutes')
	expect(params[MAX_EXPIRES_AT]).toBeNull()
	expect(authLog.type).toBe('session_policy_applied')
})

test('A19: rememberMeAllowed=false → client longer expiration is ignored, forced to default', async () => {
	// Client asks for 600 min, but remember-me is denied → default 30m.
	const { insertParams: params, authLog } = await run({
		expiration: 600,
		policies: [policy({ remember_me_allowed: false })],
	})
	expect(params[EXPIRATION]).toBe(30)
	expect(params[EXPIRES_AT]).toEqual(new Date('2026-05-21T12:30:00Z'))
	expect(authLog.type).toBe('session_policy_applied')
})
