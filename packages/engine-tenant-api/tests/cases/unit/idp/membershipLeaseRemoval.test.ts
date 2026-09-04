import { describe, expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import { ClearMembershipLeasesByProviderCommand, DatabaseContext, type Providers } from '../../../../src/index.js'
import { IDPHandlerRegistry, IDPManager } from '../../../../src/model/service/idp/index.js'
import { IdPMock } from '../../../src/IdPMock.js'
import { SQL } from '../../../src/tags.js'

// A32 rollback — removing `membershipLease` from a mapping must un-expire what it already stamped. Renewal
// only reaches people who sign in again, and the sweep stops running once the lease is gone, so the rows of
// exactly the population the lease targets would otherwise stay refused forever.

const providers: Providers = {
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	now: () => new Date('2026-09-03T12:00:00Z'),
	randomBytes: async length => Buffer.alloc(length),
	uuid: () => 'aaaaaaaa-0000-0000-0000-000000000000',
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encrypt: async value => ({ value, version: 1 }),
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
}

const withMockedDb = async (expected: ExpectedQuery[], cb: (db: DatabaseContext) => Promise<void>): Promise<void> => {
	const connection = createConnectionMock(expected)
	await cb(new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers))
	expect(expected).toHaveLength(0)
}

const IDP_ID = 'idp-1'

const clearLeasesSql = (rowCount: number): ExpectedQuery => ({
	// `identity_provider_id` is only read, never written: the row keeps its grantor and becomes what a
	// mapping with no lease grants. `> now()` is the guard the next section pins.
	sql: SQL`update "tenant"."project_membership" set "lease_expires_at" = ?
	         where "identity_provider_id" = ? and "lease_expires_at" is not null and "lease_expires_at" > now()`,
	parameters: [null, IDP_ID],
	response: { rowCount },
})

const rules = [{ claim: 'groups', contains: 'editors', grantMembership: { project: 'demo', role: 'editor' } }]

describe('A32 lease removal — the command', () => {
	test('clears the expiry of the provider running leases and reports how many it cleared', async () => {
		await withMockedDb([clearLeasesSql(3)], async db => {
			expect(await db.commandBus.execute(new ClearMembershipLeasesByProviderCommand(IDP_ID))).toBe(3)
		})
	})

	test('a lease that already lapsed is NOT revived — the update reaches only leases still running', async () => {
		// The two populations differ only by the clock, so the guard is all that separates them: a lapsed row
		// already grants nothing and the sweep will collect it, while clearing its expiry would hand that
		// access back for good — and only if the sweep happened not to have run first.
		const statement = clearLeasesSql(0)
		expect(statement.sql).toContain('"lease_expires_at" > now()')
		expect(statement.sql).not.toContain('is null or')
		await withMockedDb([statement], async db => {
			// no row matched: every lease this provider holds has already lapsed
			expect(await db.commandBus.execute(new ClearMembershipLeasesByProviderCommand(IDP_ID))).toBe(0)
		})
	})
})

describe('A32 lease removal — updateIDP detects it', () => {
	const makeManager = () => {
		const registry = new IDPHandlerRegistry()
		registry.registerHandler('mock', new IdPMock())
		return new IDPManager(registry, { getSchema: () => Promise.resolve(undefined) })
	}

	const begin: ExpectedQuery[] = [
		{ sql: 'BEGIN;', response: { rowCount: 1 } },
		{ sql: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ', response: { rowCount: 1 } },
	]
	const commit: ExpectedQuery = { sql: 'COMMIT;', response: { rowCount: 1 } }

	const fetchIdp = (configuration: Record<string, unknown>): ExpectedQuery => ({
		sql: SQL`select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive",
		                "init_returns_config" as "initReturnsConfig", "require_verified_email" as "requireVerifiedEmail",
		                "assume_email_verified" as "assumeEmailVerified"
		         from "tenant"."identity_provider" where "slug" = ?`,
		parameters: ['mock'],
		response: {
			rows: [{
				id: IDP_ID,
				slug: 'mock',
				type: 'mock',
				configuration,
				disabledAt: null,
				autoSignUp: false,
				exclusive: false,
				initReturnsConfig: false,
				requireVerifiedEmail: false,
				assumeEmailVerified: false,
			}],
		},
	})

	const storeIdp = (configuration: Record<string, unknown>): ExpectedQuery => ({
		sql: SQL`update "tenant"."identity_provider" set "configuration" = ? where "id" = ?`,
		parameters: [configuration, IDP_ID],
		response: { rowCount: 1 },
	})

	const leased = { rules, unmatched: 'remove', membershipLease: '30 days' }

	test('a merge that nulls the lease is a removal — the stored expiries are cleared', async () => {
		await withMockedDb([
			...begin,
			fetchIdp({ claimMapping: leased }),
			storeIdp({ claimMapping: { rules, unmatched: 'remove' } }),
			clearLeasesSql(2),
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', { configuration: { claimMapping: { membershipLease: null } } }, true)
			expect(response.ok).toBe(true)
		})
	})

	test('dropping the whole claimMapping takes the lease with it', async () => {
		await withMockedDb([
			...begin,
			fetchIdp({ clientId: 'cid', claimMapping: leased }),
			storeIdp({ clientId: 'cid' }),
			clearLeasesSql(1),
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', { configuration: { claimMapping: null } }, true)
			expect(response.ok).toBe(true)
		})
	})

	test('a full replace without the lease is a removal too', async () => {
		await withMockedDb([
			...begin,
			fetchIdp({ claimMapping: leased }),
			storeIdp({ claimMapping: { rules, unmatched: 'remove' } }),
			clearLeasesSql(5),
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', {
				configuration: { claimMapping: { rules, unmatched: 'remove' } },
			}, false)
			expect(response.ok).toBe(true)
		})
	})

	test('a merge that does not mention the lease keeps it, so nothing is cleared', async () => {
		// The merge preserves an unmentioned key, so the lease survives this update — clearing here would
		// silently un-lease everyone on an unrelated config edit. The mock fails on any extra statement.
		const newRules = [{ claim: 'groups', contains: 'admins', grantMembership: { project: 'demo', role: 'admin' } }]
		await withMockedDb([
			...begin,
			fetchIdp({ claimMapping: leased }),
			storeIdp({ claimMapping: { rules: newRules, unmatched: 'remove', membershipLease: '30 days' } }),
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', { configuration: { claimMapping: { rules: newRules } } }, true)
			expect(response.ok).toBe(true)
		})
	})

	test('a mapping that never configured a lease issues no clear', async () => {
		await withMockedDb([
			...begin,
			fetchIdp({ claimMapping: { rules } }),
			storeIdp({ claimMapping: { rules, unmatched: 'keep' } }),
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', { configuration: { claimMapping: { unmatched: 'keep' } } }, true)
			expect(response.ok).toBe(true)
		})
	})

	test('an update that carries no configuration at all issues no clear', async () => {
		await withMockedDb([
			...begin,
			fetchIdp({ claimMapping: leased }),
			{
				sql: SQL`update "tenant"."identity_provider" set "auto_sign_up" = ? where "id" = ?`,
				parameters: [true, IDP_ID],
				response: { rowCount: 1 },
			},
			commit,
		], async db => {
			const response = await makeManager().updateIDP(db, 'mock', { options: { autoSignUp: true } }, true)
			expect(response.ok).toBe(true)
		})
	})
})
