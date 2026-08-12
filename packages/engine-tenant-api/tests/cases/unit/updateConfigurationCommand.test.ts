import { expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, type Providers, Schema, UpdateConfigurationCommand } from '../../../src/index.js'

const createProviders = (encrypt: Providers['encrypt'] = async value => ({ value, version: 1 })): Providers => ({
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	now: () => new Date('2026-08-11T00:00:00Z'),
	randomBytes: async length => Buffer.alloc(length),
	uuid: () => '00000000-0000-0000-0000-000000000000',
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encrypt,
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
})

const execute = async (
	configuration: Schema.ConfigInput,
	expectedQuery: ExpectedQuery,
	providers: Providers = createProviders(),
): Promise<void> => {
	const expectedQueries = [expectedQuery]
	const connection = createConnectionMock(expectedQueries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	const db = new DatabaseContext(client, providers)

	await db.commandBus.execute(new UpdateConfigurationCommand(configuration))

	expect(expectedQueries).toHaveLength(0)
}

test('captcha secret null preserves the stored secret and version while provider null disables captcha', async () => {
	let encryptCalls = 0
	const providers = createProviders(async value => {
		encryptCalls++
		return { value, version: 99 }
	})

	await execute({ captcha: { provider: null, secret: null } }, {
		sql: 'update "tenant"."config" set "captcha_provider" = ? where "id" = ?',
		parameters: [null, 'singleton'],
		response: { rowCount: 1 },
	}, providers)

	// The partial UPDATE omits both stored columns, so their existing bytes/version survive.
	expect(encryptCalls).toBe(0)
})

test('omitting captcha secret preserves the stored secret and version', async () => {
	await execute({ captcha: { threshold: null } }, {
		sql: 'update "tenant"."config" set "captcha_threshold" = ? where "id" = ?',
		parameters: [null, 'singleton'],
		response: { rowCount: 1 },
	})
})

test('an empty captcha secret explicitly clears both stored secret columns', async () => {
	await execute({ captcha: { secret: '' } }, {
		sql: 'update "tenant"."config" set "captcha_secret" = ?, "captcha_secret_version" = ? where "id" = ?',
		parameters: [null, null, 'singleton'],
		response: { rowCount: 1 },
	})
})
