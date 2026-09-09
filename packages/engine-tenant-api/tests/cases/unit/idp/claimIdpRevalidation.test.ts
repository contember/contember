import { expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, type Providers } from '../../../../src/index.js'
import { ClaimIdpRevalidationCommand } from '../../../../src/model/commands/idp/ClaimIdpRevalidationCommand.js'

const providers: Providers = {
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	now: () => new Date('2026-05-26T12:00:00Z'),
	randomBytes: async length => Buffer.alloc(length),
	uuid: () => '00000000-0000-0000-0000-000000000000',
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encrypt: async value => ({ value, version: 1 }),
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
}

const execute = async (expectedQuery: ExpectedQuery): Promise<boolean> => {
	const expectedQueries = [expectedQuery]
	const connection = createConnectionMock(expectedQueries)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)

	const claimed = await db.commandBus.execute(new ClaimIdpRevalidationCommand('idp-session-1', '30 seconds'))

	expect(expectedQueries).toHaveLength(0)
	return claimed
}

// The table must be schema-qualified: the tenant schema is not on the connection's search_path,
// so an unqualified name makes the claim fail on every request, and the caller treats that as
// "somebody else holds the claim" — re-validation then never runs at all.
test('the claim is issued against the qualified tenant table', async () => {
	const claimed = await execute({
		sql: 'update "tenant"."idp_session" set "last_validated_at" = now() where "id" = ? and "last_validated_at" <= now() - ?::interval',
		parameters: ['idp-session-1', '30 seconds'],
		response: { rowCount: 1 },
	})

	expect(claimed).toBe(true)
})

test('a session still inside the throttle window is not claimed', async () => {
	const claimed = await execute({
		sql: 'update "tenant"."idp_session" set "last_validated_at" = now() where "id" = ? and "last_validated_at" <= now() - ?::interval',
		parameters: ['idp-session-1', '30 seconds'],
		response: { rowCount: 0 },
	})

	expect(claimed).toBe(false)
})
