import { describe, expect, test } from 'bun:test'
import { BackchannelLogoutManager, IDPHandlerRegistry, LogoutTokenClaims } from '../../../../src/model/service/idp/index.js'
import { DatabaseContext } from '../../../../src/index.js'
import { IdentityProviderBySlugQuery } from '../../../../src/model/queries/idp/IdentityProviderBySlugQuery.js'
import { IdpSessionsBySidQuery } from '../../../../src/model/queries/idp/IdpSessionsBySidQuery.js'
import { IdpSessionsBySubQuery } from '../../../../src/model/queries/idp/IdpSessionsBySubQuery.js'
import { ApiKeyByIdQuery } from '../../../../src/model/queries/apiKey/ApiKeyQuery.js'
import { DisableApiKeyCommand } from '../../../../src/model/commands/index.js'
import { CreateAuthLogEntryCommand } from '../../../../src/model/commands/authLog/CreateAuthLogEntryCommand.js'

const providerRow = (overrides: Record<string, unknown> = {}) => ({
	id: 'idp-1',
	slug: 'corp',
	type: 'oidc',
	disabledAt: null,
	configuration: {},
	autoSignUp: false,
	exclusive: false,
	initReturnsConfig: false,
	requireVerifiedEmail: false,
	...overrides,
})

type HarnessOpts = {
	provider?: ReturnType<typeof providerRow> | null
	sessionsBySid?: { id: string; apiKeyId: string }[]
	sessionsBySub?: { id: string; apiKeyId: string }[]
	apiKeyRow?: { identity_id: string; person_id: string | null } | null
}

const createHarness = (opts: HarnessOpts = {}) => {
	const executed: any[] = []
	const commandBus = {
		execute: async (command: any) => {
			executed.push(command)
			if (command instanceof DisableApiKeyCommand) {
				return true
			}
			return undefined
		},
	}
	const queryHandler = {
		fetch: async (query: any) => {
			if (query instanceof IdentityProviderBySlugQuery) {
				return opts.provider === undefined ? providerRow() : opts.provider
			}
			if (query instanceof IdpSessionsBySidQuery) {
				return opts.sessionsBySid ?? []
			}
			if (query instanceof IdpSessionsBySubQuery) {
				return opts.sessionsBySub ?? []
			}
			if (query instanceof ApiKeyByIdQuery) {
				return opts.apiKeyRow ?? { identity_id: 'identity-1', person_id: 'person-1' }
			}
			return null
		},
	}
	const ctx = { commandBus, queryHandler } as unknown as DatabaseContext
	return { db: ctx, executed }
}

const registryWith = (validateLogoutToken?: (config: any, token: string) => Promise<LogoutTokenClaims>): IDPHandlerRegistry => {
	const registry = new IDPHandlerRegistry()
	registry.registerHandler('oidc', {
		initAuth: async () => ({ authUrl: '', sessionData: {} }),
		processResponse: async () => ({ externalIdentifier: 'x' }),
		validateConfiguration: (c: unknown) => c as {},
		...(validateLogoutToken ? { validateLogoutToken } : {}),
	})
	return registry
}

describe('BackchannelLogoutManager', () => {
	test('unknown provider slug → provider_not_found, no commands', async () => {
		const h = createHarness({ provider: null })
		const result = await new BackchannelLogoutManager(registryWith(async () => ({ sid: 's' }))).logout(h.db, 'missing', 'sid:s')
		expect(result.status).toBe('provider_not_found')
		expect(h.executed).toHaveLength(0)
	})

	test('provider without back-channel support → not_supported', async () => {
		const h = createHarness()
		const result = await new BackchannelLogoutManager(registryWith(/* no validateLogoutToken */)).logout(h.db, 'corp', 'sid:s')
		expect(result.status).toBe('not_supported')
		expect(h.executed).toHaveLength(0)
	})

	test('invalid logout token → invalid_token, no revoke', async () => {
		const h = createHarness()
		const result = await new BackchannelLogoutManager(registryWith(async () => {
			throw new Error('bad signature')
		})).logout(h.db, 'corp', 'garbage')
		expect(result.status).toBe('invalid_token')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})

	test('valid sid → revokes matching api_key(s) and audits with the resolved identity', async () => {
		const h = createHarness({
			sessionsBySid: [{ id: 'sess-1', apiKeyId: 'api-key-1' }, { id: 'sess-2', apiKeyId: 'api-key-2' }],
			apiKeyRow: { identity_id: 'identity-7', person_id: 'person-7' },
		})
		const result = await new BackchannelLogoutManager(registryWith(async () => ({ sid: 'sid-1' }))).logout(h.db, 'corp', 'sid:sid-1')
		expect(result).toEqual({ status: 'ok', revokedCount: 2 })

		const disables = h.executed.filter(c => c instanceof DisableApiKeyCommand)
		expect(disables).toHaveLength(2)
		const auditEntries = h.executed.filter(c => c instanceof CreateAuthLogEntryCommand)
		expect(auditEntries).toHaveLength(1)
		// invoked_by_id is resolved from the targeted session's api key, not the provider id
		expect((auditEntries[0] as any).data.invokedById).toBe('identity-7')
		expect((auditEntries[0] as any).data.personId).toBe('person-7')
	})

	test('valid sid with no matching session → ok, revokedCount 0, audited without an invoking identity', async () => {
		const h = createHarness({ sessionsBySid: [] })
		const result = await new BackchannelLogoutManager(registryWith(async () => ({ sid: 'sid-unknown' }))).logout(h.db, 'corp', 'sid:sid-unknown')
		expect(result).toEqual({ status: 'ok', revokedCount: 0 })
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
		// still audited (a logout was processed), but with no acting identity — must NOT fall back to
		// the provider id (which would violate the invoked_by_id FK).
		const auditEntries = h.executed.filter(c => c instanceof CreateAuthLogEntryCommand)
		expect(auditEntries).toHaveLength(1)
		expect((auditEntries[0] as any).data.invokedById).toBeUndefined()
	})

	test("sub-only logout token → revokes all the subject's federated sessions and audits", async () => {
		const h = createHarness({
			sessionsBySub: [{ id: 'sess-1', apiKeyId: 'api-key-1' }, { id: 'sess-2', apiKeyId: 'api-key-2' }],
		})
		const result = await new BackchannelLogoutManager(registryWith(async () => ({ sub: 'user-1' }))).logout(h.db, 'corp', 'sub:user-1')
		expect(result).toEqual({ status: 'ok', revokedCount: 2 })
		expect(h.executed.filter(c => c instanceof DisableApiKeyCommand)).toHaveLength(2)
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand)).toBe(true)
	})

	test('sub-only logout token with no matching session → ok, revokedCount 0, still audited', async () => {
		const h = createHarness({ sessionsBySub: [] })
		const result = await new BackchannelLogoutManager(registryWith(async () => ({ sub: 'user-unknown' }))).logout(h.db, 'corp', 'sub:user-unknown')
		expect(result).toEqual({ status: 'ok', revokedCount: 0 })
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand)).toBe(true)
	})
})
