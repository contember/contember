import { describe, expect, test } from 'bun:test'
import { IDPClaimSyncService, IDPHandlerRegistry, IdpSessionRevalidator, RevalidationResult } from '../../../../src/model/service/idp/index.js'
import { IdpSessionRow } from '../../../../src/model/queries/idp/IdpSessionByApiKeyQuery.js'
import { DatabaseContext } from '../../../../src/index.js'
import { ClaimIdpRevalidationCommand } from '../../../../src/model/commands/idp/ClaimIdpRevalidationCommand.js'
import { CreateOrUpdateProjectMembershipCommand, DisableApiKeyCommand, RemoveProjectMembershipCommand } from '../../../../src/model/commands/index.js'
import { UpdateIdpSessionCommand } from '../../../../src/model/commands/idp/UpdateIdpSessionCommand.js'
import { CreateAuthLogEntryCommand } from '../../../../src/model/commands/authLog/CreateAuthLogEntryCommand.js'
import { ProjectBySlugQuery, ProjectMembershipByIdentityQuery } from '../../../../src/model/queries/index.js'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

const NOW = new Date('2026-05-26T12:00:00Z')
const t = (iso: string) => new Date(`2026-05-26T${iso}Z`)

// All production constructions take the claim-sync service; it is stateless, so a fresh instance per
// revalidator is fine. Tests that don't configure a claimMapping never reach it. The claim-sync service
// resolves the project schema for its apply-time safety check: a project that EXISTS but whose schema can't
// be resolved is now fail-closed (the grant is dropped — see IDPClaimSyncService.dropUnsafeRules). The
// happy-path claim tests below grant the plain `editor` role on the existing `demo` project, so they need a
// resolvable schema that defines that role (otherwise the apply-time backstop would drop the grant).
const claimSyncSchema: Schema = { ...emptySchema, acl: { roles: { editor: { stages: '*', entities: {}, variables: {} } } } }
const makeRevalidator = (registry: IDPHandlerRegistry) =>
	new IdpSessionRevalidator(registry, new IDPClaimSyncService({ getSchema: () => Promise.resolve(claimSyncSchema) }))

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
		expect(await makeRevalidator(registryWith()).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe('valid')
		expect(h.executed).toHaveLength(0)
	})

	test('revalidation disabled → valid', async () => {
		const h = createHarness(baseRow({ providerConfiguration: { revalidation: { enabled: false } } }))
		expect(await makeRevalidator(registryWith(async () => ({ status: 'valid' }))).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe(
			'valid',
		)
		expect(h.executed).toHaveLength(0)
	})

	test('provider disabled → revoked', async () => {
		const h = createHarness(baseRow({ providerDisabledAt: t('11:30:00') }))
		expect(await makeRevalidator(registryWith(async () => ({ status: 'valid' }))).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe(
			'revoked',
		)
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
	})

	test('provider cannot revalidate → valid', async () => {
		const h = createHarness(baseRow())
		expect(await makeRevalidator(registryWith(/* no revalidate */)).revalidate(h.dbContext, h.readDbContext, apiKeyRow)).toBe('valid')
		expect(h.executed).toHaveLength(0)
	})
})

describe('IdpSessionRevalidator — lifetime-driven phases', () => {
	test('fresh token (before soft threshold) → skip, no claim, no IdP call', async () => {
		let called = false
		// obtained 11:55, expires 13:55 → softAt = 12:55 > NOW
		const h = createHarness(baseRow({ tokenObtainedAt: t('11:55:00'), session: { tokens: { refresh_token: 'r' }, expiresAt: t('13:55:00') } }))
		const out = await makeRevalidator(registryWith(async () => {
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
		const out = await makeRevalidator(registryWith(async () => {
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
		const out = await makeRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('revoked')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand) as CreateAuthLogEntryCommand | undefined
		expect(log).toBeDefined()
		expect((log as any).data.type).toBe('idp_session_revoked')
		expect((log as any).data.success).toBe(false)
		expect((log as any).data.errorCode).toBe('invalid_grant')
		// the reason is the action payload → event_data (where the rest of the audit system reads it)
		expect((log as any).data.eventData).toEqual({ reason: 'invalid_grant' })
		expect((log as any).data.metadata).toBeUndefined()
	})

	test('expired token + valid refresh → valid, persists rotated session', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await makeRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		)
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof UpdateIdpSessionCommand)).toBe(true)
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})

	test('persist failure after a successful blocking refresh → valid (fail open, no 500)', async () => {
		// The IdP has already vouched for the session; a transient DB / encrypt failure in the
		// post-success bookkeeping must NOT propagate and fail the blocking verify request.
		const executed: any[] = []
		const commandBus = {
			execute: async (command: any) => {
				executed.push(command)
				if (command instanceof ClaimIdpRevalidationCommand) {
					return true
				}
				if (command instanceof UpdateIdpSessionCommand) {
					throw new Error('db down') // persist the rotated token fails after a successful refresh
				}
				return undefined
			},
		}
		const ctx = {
			providers: { now: () => NOW },
			commandBus,
			queryHandler: { fetch: async () => baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }) }, // expired → blocking
		} as unknown as DatabaseContext

		const out = await makeRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		).revalidate(ctx, ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(executed.some(c => c instanceof UpdateIdpSessionCommand)).toBe(true)
		expect(executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})

	test('mode=blocking forces synchronous revoke even in the soft window', async () => {
		const h = createHarness(baseRow({ providerConfiguration: { revalidation: { enabled: true, mode: 'blocking' } } }))
		const out = await makeRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
			.revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('revoked')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(true)
	})

	test('no token expiry → fallback background throttle (revalidates, deferred)', async () => {
		let called = false
		const h = createHarness(baseRow({ tokenObtainedAt: null, session: { sessionId: 's', tokens: { access_token: 'a' }, expiresAt: undefined } }))
		const out = await makeRevalidator(registryWith(async () => {
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
		const out = await makeRevalidator(registryWith(async () => {
			called = true
			return { status: 'valid' }
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		await tick()
		expect(called).toBe(false)
	})

	test('transient IdP failure in blocking phase → valid (fail open, no revoke)', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await makeRevalidator(registryWith(async () => {
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
		const out = await makeRevalidator(registry).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
	})
})

describe('IdpSessionRevalidator — audit logging', () => {
	test('token rotation is audited as idp_session_revalidated', async () => {
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		await makeRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand) as CreateAuthLogEntryCommand | undefined
		expect(log).toBeDefined()
		expect((log as any).data.type).toBe('idp_session_revalidated')
		expect((log as any).data.success).toBe(true)
	})

	test('records the originating request IP / user agent on both revoke and revalidated entries', async () => {
		const reqInfo = { ip: '203.0.113.7', userAgent: 'Mozilla/5.0 test' }

		const revoked = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		await makeRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
			.revalidate(revoked.dbContext, revoked.readDbContext, apiKeyRow, reqInfo)
		const revokeLog = revoked.executed.find(c => c instanceof CreateAuthLogEntryCommand) as any
		expect(revokeLog.data.ipAddress).toBe('203.0.113.7')
		expect(revokeLog.data.userAgent).toBe('Mozilla/5.0 test')

		const rotated = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		await makeRevalidator(
			registryWith(async () => ({ status: 'valid', idpSession: { tokens: { refresh_token: 'new' }, expiresAt: t('13:30:00') } })),
		).revalidate(rotated.dbContext, rotated.readDbContext, apiKeyRow, reqInfo)
		const rotateLog = rotated.executed.find(c => c instanceof CreateAuthLogEntryCommand) as any
		expect(rotateLog.data.ipAddress).toBe('203.0.113.7')
		expect(rotateLog.data.userAgent).toBe('Mozilla/5.0 test')
	})

	test('transient IdP failure (fail open) is audited as idp_session_revalidation_failed / revalidation_error', async () => {
		// expired → blocking, so the failure audit runs synchronously
		const h = createHarness(baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }))
		const out = await makeRevalidator(registryWith(async () => {
			throw new Error('ECONNREFUSED')
		})).revalidate(h.dbContext, h.readDbContext, apiKeyRow, { ip: '203.0.113.7', userAgent: 'UA' })
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand) as any
		expect(log).toBeDefined()
		expect(log.data.type).toBe('idp_session_revalidation_failed')
		expect(log.data.errorCode).toBe('revalidation_error')
		expect(log.data.success).toBe(true) // fail-open marker, not a security failure
		expect(log.data.ipAddress).toBe('203.0.113.7')
	})

	test('corrupt stored config (fail open) is audited as idp_session_revalidation_failed / config_invalid', async () => {
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
		const out = await makeRevalidator(registry).revalidate(h.dbContext, h.readDbContext, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand) as any
		expect(log).toBeDefined()
		expect(log.data.type).toBe('idp_session_revalidation_failed')
		expect(log.data.errorCode).toBe('config_invalid')
	})

	test('a failing audit write on fail-open does not crash a blocking request', async () => {
		// expired → blocking; the failure-audit insert itself throws and must be swallowed
		const executed: any[] = []
		const commandBus = {
			execute: async (command: any) => {
				executed.push(command)
				if (command instanceof ClaimIdpRevalidationCommand) {
					return true
				}
				if (command instanceof CreateAuthLogEntryCommand) {
					throw new Error('audit db down')
				}
				return undefined
			},
		}
		const ctx = {
			providers: { now: () => NOW },
			commandBus,
			queryHandler: { fetch: async () => baseRow({ session: { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') } }) },
		} as unknown as DatabaseContext
		const out = await makeRevalidator(registryWith(async () => {
			throw new Error('ECONNREFUSED')
		})).revalidate(ctx, ctx, apiKeyRow)
		expect(out).toBe('valid')
	})

	test('a no-op probe (valid, no rotated session) is NOT logged', async () => {
		// userinfo / introspection return valid without an idpSession; logging every such tick
		// (every minInterval) would flood the audit log, so it must stay silent.
		const h = createHarness(baseRow({ session: { tokens: { access_token: 'a' }, expiresAt: t('11:30:00') } }))
		const out = await makeRevalidator(registryWith(async () => ({ status: 'valid' })))
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

			const out = await makeRevalidator(registryWith(async () => ({ status: 'revoked', reason: 'invalid_grant' })))
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

describe('IdpSessionRevalidator — A09 claim mapping on refresh', () => {
	// Expired token → blocking refresh that returns fresh claims; the row carries an `always` claim
	// mapping granting `demo::editor` when `department === 'Editorial'`.
	const expiredSession = { tokens: { refresh_token: 'r' }, expiresAt: t('11:30:00') }
	const claimMappingRow = (claimMapping: unknown) =>
		baseRow({ session: expiredSession, providerConfiguration: { revalidation: { enabled: true }, claimMapping } })

	// A query-/transaction-aware harness: the claim sync runs its real reads/writes against this mock.
	// `ProjectMembershipByIdentityQuery` returns [] the first time (before snapshot) and the granted
	// membership the second time (after snapshot), so the before/after delta is non-empty.
	const claimHarness = (row: IdpSessionRow, opts: { failTransaction?: boolean } = {}) => {
		const executed: any[] = []
		let membershipFetches = 0
		const inner: any = {
			providers: { now: () => NOW },
			commandBus: {
				execute: async (command: any) => {
					executed.push(command)
					if (command instanceof ClaimIdpRevalidationCommand) {
						return true
					}
					if (command instanceof CreateOrUpdateProjectMembershipCommand) {
						return 'membership-1'
					}
					return undefined
				},
			},
			queryHandler: {
				fetch: async (query: any) => {
					if (query instanceof ProjectBySlugQuery) {
						return { id: 'proj-1', slug: 'demo', name: 'demo', config: {} }
					}
					if (query instanceof ProjectMembershipByIdentityQuery) {
						membershipFetches++
						return membershipFetches === 1 ? [] : [{ role: 'editor', variables: [] }]
					}
					// IdpSessionByApiKeyQuery (and anything else) → the federated-session row
					return row
				},
			},
		}
		inner.transaction = opts.failTransaction
			? async () => {
				throw new Error('claim-sync tx failed')
			}
			: async (cb: (db: any) => Promise<unknown>) => cb(inner)
		return { ctx: inner as unknown as DatabaseContext, executed }
	}

	const validWithClaims = (claims: Record<string, unknown>, claimsComplete = false) =>
		registryWith(async () => ({ status: 'valid', claims, claimsComplete }))

	test('always mapping + fresh claims → re-applies the membership and audits idp_role_mapped', async () => {
		const claimMapping = { rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }] }
		const h = claimHarness(claimMappingRow(claimMapping))
		const out = await makeRevalidator(validWithClaims({ department: 'Editorial' })).revalidate(h.ctx, h.ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof CreateOrUpdateProjectMembershipCommand)).toBe(true)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand && (c as any).data.type === 'idp_role_mapped') as any
		expect(log).toBeDefined()
		expect(log.data.success).toBe(true)
		expect(log.data.eventData.after.memberships).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
	})

	test('sticky mapping is skipped on refresh (always-only) — no membership write, no audit', async () => {
		const claimMapping = {
			syncPolicy: 'sticky',
			rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
		}
		const h = claimHarness(claimMappingRow(claimMapping))
		const out = await makeRevalidator(validWithClaims({ department: 'Editorial' })).revalidate(h.ctx, h.ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof CreateOrUpdateProjectMembershipCommand)).toBe(false)
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand && (c as any).data.type === 'idp_role_mapped')).toBe(false)
	})

	test('claim sync failure is fail-open: session stays valid, audited as idp_role_mapping_failed', async () => {
		const claimMapping = { rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }] }
		const h = claimHarness(claimMappingRow(claimMapping), { failTransaction: true })
		const out = await makeRevalidator(validWithClaims({ department: 'Editorial' })).revalidate(h.ctx, h.ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof DisableApiKeyCommand)).toBe(false)
		const log = h.executed.find(c => c instanceof CreateAuthLogEntryCommand && (c as any).data.type === 'idp_role_mapping_failed') as any
		expect(log).toBeDefined()
		expect(log.data.success).toBe(true)
	})

	test('refresh without fresh claims does not run claim sync', async () => {
		const claimMapping = { rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }] }
		const h = claimHarness(claimMappingRow(claimMapping))
		// revalidate returns valid but with NO claims (e.g. introspection) → nothing to map
		const out = await makeRevalidator(registryWith(async () => ({ status: 'valid' }))).revalidate(h.ctx, h.ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(h.executed.some(c => c instanceof CreateOrUpdateProjectMembershipCommand)).toBe(false)
		expect(h.executed.some(c => c instanceof CreateAuthLogEntryCommand)).toBe(false)
	})

	test('complete surface (method:refresh) + unmatched:remove → revokes on refresh, exactly like sign-in', async () => {
		// Variant A: a `method: "refresh"` rebuilds sign-in's full claim surface (claimsComplete:true), so refresh
		// reconciles like a sign-in — a rule that no longer matches strips its membership under `remove`.
		const claimMapping = {
			unmatched: 'remove',
			rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
		}
		const row = claimMappingRow(claimMapping)
		const executed: any[] = []
		let membershipFetches = 0
		const inner: any = {
			providers: { now: () => NOW },
			commandBus: {
				execute: async (command: any) => {
					executed.push(command)
					if (command instanceof ClaimIdpRevalidationCommand) {
						return true
					}
					return undefined
				},
			},
			queryHandler: {
				fetch: async (query: any) => {
					if (query instanceof ProjectBySlugQuery) {
						return { id: 'proj-1', slug: 'demo', name: 'demo', config: {} }
					}
					if (query instanceof ProjectMembershipByIdentityQuery) {
						membershipFetches++
						// the before-snapshot + the remove reconciliation (reads 1 & 2) still see `editor`; the
						// after-snapshot (read 3) sees it gone, so the audit delta is non-empty.
						return membershipFetches <= 2 ? [{ role: 'editor', variables: [] }] : []
					}
					return row
				},
			},
		}
		inner.transaction = async (cb: (db: any) => Promise<unknown>) => cb(inner)
		const ctx = inner as unknown as DatabaseContext
		// the claim no longer matches → `editor` is out of the granted set → removed under `remove`
		const out = await makeRevalidator(validWithClaims({ department: 'Sales' }, true)).revalidate(ctx, ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(executed.filter(c => c instanceof RemoveProjectMembershipCommand)).toHaveLength(1)
		const log = executed.find(c => c instanceof CreateAuthLogEntryCommand && (c as any).data.type === 'idp_role_mapped') as any
		expect(log).toBeDefined()
		expect(log.data.eventData.before.memberships).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(log.data.eventData.after.memberships).toEqual([])
	})

	test('partial surface (userinfo / failed userinfo) + unmatched:remove → does NOT remove on refresh', async () => {
		// A partial surface (claimsComplete:false — method:userinfo, or a refresh whose userinfo fetch failed)
		// stays additive-only: a rule that misses here must not strip a membership the IdP still asserts. Removal
		// is deferred to a full sign-in, which always sees the complete surface.
		const claimMapping = {
			unmatched: 'remove',
			rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
		}
		const row = claimMappingRow(claimMapping)
		const executed: any[] = []
		const inner: any = {
			providers: { now: () => NOW },
			commandBus: {
				execute: async (command: any) => {
					executed.push(command)
					if (command instanceof ClaimIdpRevalidationCommand) {
						return true
					}
					return undefined
				},
			},
			queryHandler: {
				fetch: async (query: any) => {
					if (query instanceof ProjectBySlugQuery) {
						return { id: 'proj-1', slug: 'demo', name: 'demo', config: {} }
					}
					if (query instanceof ProjectMembershipByIdentityQuery) {
						return [{ role: 'editor', variables: [] }]
					}
					return row
				},
			},
		}
		inner.transaction = async (cb: (db: any) => Promise<unknown>) => cb(inner)
		const ctx = inner as unknown as DatabaseContext
		// claimsComplete defaults false → allowRemoval false → keep, so the still-asserted membership is left alone
		const out = await makeRevalidator(validWithClaims({ department: 'Sales' })).revalidate(ctx, ctx, apiKeyRow)
		expect(out).toBe('valid')
		expect(executed.some(c => c instanceof RemoveProjectMembershipCommand)).toBe(false)
		// nothing changed (removal off, no grant) → no idp_role_mapped audit
		expect(executed.some(c => c instanceof CreateAuthLogEntryCommand && (c as any).data.type === 'idp_role_mapped')).toBe(false)
	})
})
