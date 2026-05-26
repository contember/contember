import { describe, expect, test } from 'bun:test'
import { IDPHandlerRegistry, IdpSessionRevalidator, RevalidationResult } from '../../../../src/model/service/idp'
import { IdpSessionRow } from '../../../../src/model/queries/idp/IdpSessionByApiKeyQuery'
import { DatabaseContext } from '../../../../src'
import { ClaimIdpRevalidationCommand } from '../../../../src/model/commands/idp/ClaimIdpRevalidationCommand'
import { DisableApiKeyCommand } from '../../../../src/model/commands'
import { UpdateIdpSessionCommand } from '../../../../src/model/commands/idp/UpdateIdpSessionCommand'
import { CreateAuthLogEntryCommand } from '../../../../src/model/commands/authLog/CreateAuthLogEntryCommand'

const NOW = new Date('2026-05-26T12:00:00Z')
const t = (iso: string) => new Date(`2026-05-26T${iso}Z`)

const apiKeyRow: any = {
	id: 'api-key-1',
	identity_id: 'identity-1',
	person_id: 'person-1',
	type: 'session',
	disabled_at: null,
	expires_at: null,
	roles: [],
	trust_forwarded_info: false,
}

// default = SOFT phase at NOW: obtained 10:00, expires 13:00 → softAt (0.5) = 11:30 ≤ 12:00 < 13:00
const baseRow = (overrides: Partial<IdpSessionRow> = {}): IdpSessionRow => ({
	id: 'idp-session-1',
	identityProviderId: 'idp-1',
	providerType: 'oidc',
	providerConfiguration: { revalidation: { enabled: true } },
	providerDisabledAt: null,
	tokenObtainedAt: t('10:00:00'),
	lastValidatedAt: t('11:00:00'),
	createdAt: t('10:00:00'),
	session: { sessionId: 'sid-1', tokens: { refresh_token: 'r' }, expiresAt: t('13:00:00') },
	...overrides,
})

const createHarness = (row: IdpSessionRow | null, opts: { claim?: boolean } = {}) => {
	const executed: any[] = []
	const commandBus = {
		execute: async (command: any) => {
			executed.push(command)
			if (command instanceof ClaimIdpRevalidationCommand) {
				return opts.claim ?? true
			}
			if (command instanceof DisableApiKeyCommand) {
				return true
			}
			return undefined
		},
	}
	const ctx = {
		providers: { now: () => NOW },
		commandBus,
		queryHandler: { fetch: async () => row },
	} as unknown as DatabaseContext
	return { dbContext: ctx, readDbContext: ctx, executed }
}

const registryWith = (revalidate?: (config: any, session: any) => Promise<RevalidationResult>): IDPHandlerRegistry => {
	const registry = new IDPHandlerRegistry()
	registry.registerHandler('oidc', {
		initAuth: async () => ({ authUrl: '', sessionData: {} }),
		processResponse: async () => ({ externalIdentifier: 'x' }),
		validateConfiguration: (c: unknown) => c as {},
		...(revalidate ? { revalidate } : {}),
	})
	return registry
}

const tick = () => new Promise(resolve => setImmediate(resolve))

describe('IdpSessionRevalidator — gating', () => {
	test('no federated session → valid, no commands', async () => {
		const h = createHarness(null)
		expect(await new IdpSessionRevalidator(registryWith()).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe('valid')
		expect(h.executed).toHaveLength(0)
	})

	test('revalidation disabled → valid', async () => {
		const h = createHarness(baseRow({ providerConfiguration: { revalidation: { enabled: false } } }))
		expect(await new IdpSessionRevalidator(registryWith(async () => ({ status: 'valid' }))).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe(
			'valid',
		)
		expect(h.executed).toHaveLength(0)
	})

	test('provider disabled → revoked', async () => {
		const h = createHarness(baseRow({ providerDisabledAt: t('11:30:00') }))
		expect(await new IdpSessionRevalidator(registryWith(async () => ({ status: 'valid' }))).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe(
			'revoked',
		)
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
	})

	test('provider cannot revalidate → valid', async () => {
		const h = createHarness(baseRow())
		expect(await new IdpSessionRevalidator(registryWith(/* no revalidate */)).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe('valid')
		expect(h.executed).toHaveLength(0)
	})
})

describe('IdpSessionRevalidator — lifetime-driven phases', () => {
	test('fresh token (before soft threshold) → skip, no claim, no IdP call', async () => {
		let called = false
		// obtained 11:55, expires 13:55 → softAt = 12:55 > NOW
		const h = createHarness(baseRow({ tokenObtainedAt: t('11:55:00'), session: { tokens: { refresh_token: 'r' }, expiresAt: t('13:55:00') } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => {
			called = true
			return { status: 'valid' }
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(called).toBe(false)
		expect(h.executed).toHaveLength(0)
	})

	test('soft window → background (SWR): valid immediately, refresh after the response', async () => {
		let called = false
		const h = createHarness(baseRow()) // soft phase
		const out = await new IdpSessionRevalidator(registryWith(async () => {
			called = true
			return { status: 'revoked', reason: 'invalid_grant' }
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid') // served from the still-valid token
		expect(called).toBe(false) // not yet — deferred to setImmediate
		expect(h.executed.some(c => c instanceof ClaimIdpRevalidationCommand)).toBe(true)
		await tick()
		expect(called).toBe(true)
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
	})

	test('expired token → blocking: revoked returned synchronously', async () => {
		// expires 11:30 (past), obtained 10:00 → hard
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('revoked')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand)).toBe(true)
	})

	test('expired token + valid refresh → valid, persists rotated session', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await new IdpSessionRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		)
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof UpdateIdpSessionCommand)).toBe(true)
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})

	test('mode=blocking forces synchronous revoke even in the soft window', async () => {
		const h = createHarness(baseRow({ providerConfiguration: { revalidation: { enabled: true, mode: 'blocking' } } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('revoked')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
	})

	test('no token expiry → fallback background throttle (revalidates, deferred)', async () => {
		let called = false
		const h = createHarness(baseRow({ tokenObtainedAt: null, session: { sessionId: 's', tokens: { access_token: 'a' }, expiresAt: undefined } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => {
			called = true
			return { status: 'valid' }
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(called).toBe(false)
		await tick()
		expect(called).toBe(true)
	})

	test('throttled (claim lost) → valid, revalidate not called', async () => {
		let called = false
		const h = createHarness(baseRow(), { claim: false })
		const out = await new IdpSessionRevalidator(registryWith(async () => {
			called = true
			return { status: 'valid' }
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		await tick()
		expect(called).toBe(false)
	})

	test('transient IdP failure in blocking phase → valid (fail open, no revoke)', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => {
			throw new Error('ECONNREFUSED')
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})

	test('corrupt stored config (validateConfiguration throws) → valid (fail open, no revoke)', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const registry = new IDPHandlerRegistry()
		registry.registerHandler('oidc', {
			initAuth: async () => ({ authUrl: '', sessionData: {} }),
			processResponse: async () => ({ externalIdentifier: 'x' }),
			validateConfiguration: () => {
				throw new Error('corrupt configuration')
			},
			revalidate: async () => ({ status: 'revoked', reason: 'invalid_grant' }),
		})
		const out = await new IdpSessionRevalidator(registry).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})
})

describe('IdpSessionRevalidator — audit logging', () => {
	test('token rotation is audited as idp_session_revalidated', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		await new IdpSessionRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand) as CreateAuthLogEntryCommand | undefined
		expect(log).toBeDefined()
		expect((log as any).data.type).toBe('idp_session_revalidated')
		expect((log as any).data.success).toBe(true)
	})

	test('a no-op probe (valid, no rotated session) is NOT logged', async () => {
		// userinfo / introspection return valid without an idpSession; logging every such tick
		// (every minInterval) would flood the audit log, so it must stay silent.
		const h = createHarness(baseRow({ session: { tokens: { access_token: 'a' }, expiresAt: t('11:30:00') } }))
		const out = await new IdpSessionRevalidator(registryWith(async () => ({ status: 'valid' })))
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand)).toBe(false)
		expect(h.executed.some(c => c instanceof UpdateIdpSessionCommand)).toBe(false)
	})

	test('a DB-write failure in the background (SWR) path is swallowed — no unhandled rejection', async () => {
		const rejections: unknown[] = []
		const onRejection = (e: unknown) => rejections.push(e)
		process.on('unhandledRejection', onRejection)
		try {
			const executed: any[] = []
			const commandBus = {
				execute: async (command: any) => {
					executed.push(command)
					if (command instanceof ClaimIdpRevalidationCommand) {
						return true
					}
					if (command instanceof DisableApiKeyCommand) {
						throw new Error('db down') // the deferred revoke write fails after the response
					}
					return undefined
				},
			}
			const ctx = {
				providers: { now: () => NOW },
				commandBus,
				queryHandler: { fetch: async () => baseRow() }, // soft phase → background (SWR)
			} as unknown as DatabaseContext

			const out = await new IdpSessionRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
				.revalidate(ctx, ctx, apiKeyRow)
			expect(out).toBe('valid') // served from the still-valid token
			await tick()
			await new Promise(resolve => setTimeout(resolve, 0)) // flush the rejected-promise microtasks
			expect(rejections).toHaveLength(0)
		} finally {
			process.off('unhandledRejection', onRejection)
		}
	})
})
