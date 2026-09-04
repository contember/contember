import { describe, expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, type Providers } from '../../../../src/index.js'
import { ClaimIdpRevalidationCommand } from '../../../../src/model/commands/idp/ClaimIdpRevalidationCommand.js'
import { SQL } from '../../../src/tags.js'

// CORR-2 — the claim used hand-written SQL naming `idp_session` unqualified. Nothing sets a runtime
// `search_path`, so every call raised 42P01 and the revalidator's fail-open swallowed it: the whole
// continuous-revalidation control was inert while looking configured.

const providers: Providers = {
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	now: () => new Date('2026-09-04T12:00:00Z'),
	randomBytes: async length => Buffer.alloc(length),
	uuid: () => 'aaaaaaaa-0000-0000-0000-000000000000',
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encrypt: async value => ({ value, version: 1 }),
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
}

const SESSION_ID = 'aaaaaaaa-1111-0000-0000-000000000000'
const INTERVAL = '5 minutes'

const claimSql = (rowCount: number): ExpectedQuery => ({
	sql: SQL`update "tenant"."idp_session" set "last_validated_at" = now()
	         where "id" = ? and "last_validated_at" <= now() - ?::interval`,
	parameters: [SESSION_ID, INTERVAL],
	response: { rowCount },
})

const claim = async (statement: ExpectedQuery): Promise<boolean> => {
	const expected = [statement]
	const db = new DatabaseContext(createConnectionMock(expected).createClient('tenant', { module: 'tenant' }), providers)
	const result = await db.commandBus.execute(new ClaimIdpRevalidationCommand(SESSION_ID, INTERVAL))
	expect(expected).toHaveLength(0)
	return result
}

describe('CORR-2 claim of an IdP re-validation', () => {
	test('the table is schema-qualified, so the statement can actually run', async () => {
		expect(claimSql(1).sql).toContain('"tenant"."idp_session"')
		expect(await claim(claimSql(1))).toBe(true)
	})

	test('the throttle window is decided by the database clock on both sides', async () => {
		// A JS timestamp on either side would let two nodes with skewed clocks both win the claim and
		// rotate the refresh token against each other. `now()` twice, and no timestamp among the parameters.
		const statement = claimSql(1)
		expect(statement.sql.match(/now\(\)/g)).toHaveLength(2)
		expect(statement.parameters?.some(it => it instanceof Date)).toBe(false)
		await claim(statement)
	})

	test('the interval is a bound parameter cast to interval, never interpolated', async () => {
		const statement = claimSql(1)
		expect(statement.sql).toContain('?::interval')
		expect(statement.sql).not.toContain(INTERVAL)
		expect(statement.parameters).toEqual([SESSION_ID, INTERVAL])
		await claim(statement)
	})

	test('losing the claim reports false — no row was inside the window', async () => {
		expect(await claim(claimSql(0))).toBe(false)
	})
})
