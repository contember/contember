import { describe, expect, test } from 'bun:test'
import { Buffer } from 'buffer'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, OtpAuthenticator, OtpError, OtpManager, PersonRow, Providers } from "../../../src/index.js"

const now = new Date('2019-09-04 12:00')

const otpAuthenticator = new OtpAuthenticator({
	now: () => now,
	randomBytes: () => Promise.resolve(Buffer.alloc(20)),
})

// A reversible "encryption": prefixes the plaintext with a marker. decrypt strips it.
const ENC_PREFIX = 'ENC:'
const makeDecrypt = (needsReEncrypt = false) => (value: Buffer, version: number) => {
	expect(version).toBeGreaterThanOrEqual(1)
	const str = value.toString('utf8')
	if (!str.startsWith(ENC_PREFIX)) {
		throw new Error('cannot decrypt')
	}
	return Promise.resolve({ value: Buffer.from(str.slice(ENC_PREFIX.length), 'utf8'), needsReEncrypt })
}
const decrypt = makeDecrypt(false)
const encrypt = (value: Buffer) => Promise.resolve({ value: Buffer.from(ENC_PREFIX + value.toString('utf8')), version: 2 })

const REENCRYPT_SQL =
	`update "tenant"."person_mfa" set "totp_secret" = ?, "totp_secret_version" = ? where "person_id" = ? and "totp_secret_version" = ?`

const baseProviders = (overrides: Partial<Providers> = {}): Providers => ({
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => now,
	randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	uuid: () => 'uuid',
	decrypt,
	encrypt,
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
	...overrides,
})

const makeDb = (queries: ExpectedQuery[], providers: Providers) => {
	const connection = createConnectionMock(queries)
	const client = connection.createClient('tenant', { module: 'tenant' })
	return new DatabaseContext(client, providers)
}

const basePerson: PersonRow = {
	id: '123e4567-e89b-12d3-a456-000000000001',
	password_hash: null,
	identity_id: 'i1',
	otp_secret: null,
	otp_secret_version: null,
	otp_activated_at: null,
	otp_pending_secret: null,
	otp_pending_version: null,
	otp_pending_created_at: null,
	email_otp_enabled: false,
	email: 'john@doe.com',
	name: null,
	roles: [],
	disabled_at: null,
	passwordless_enabled: null,
	mfa_grace_until: null,
}

describe('OtpManager.verifyOtp', () => {
	test('validates a legacy version-0 (plaintext otpauth URI) secret and re-encrypts it on success', async () => {
		const providers = baseProviders()
		const otp = await otpAuthenticator.create('john', 'contember')
		const person: PersonRow = {
			...basePerson,
			otp_secret: Buffer.from(otp.uri, 'utf8'),
			otp_secret_version: 0,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)

		// Successful verify re-encrypts: base32 of the URI, encrypted (version>=1),
		// guarded on the old version 0.
		const queries: ExpectedQuery[] = [{
			sql: REENCRYPT_SQL,
			parameters: [Buffer.from(ENC_PREFIX + otp.secret), 2, person.id, 0],
			response: { rowCount: 1 },
		}]
		const db = makeDb(queries, providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyOtp(db, person, token)).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('does NOT re-encrypt a version-0 secret when verification fails', async () => {
		const providers = baseProviders()
		const otp = await otpAuthenticator.create('john', 'contember')
		const person: PersonRow = {
			...basePerson,
			otp_secret: Buffer.from(otp.uri, 'utf8'),
			otp_secret_version: 0,
			otp_activated_at: now,
		}
		const db = makeDb([], providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyOtp(db, person, '000000')).toBe(false)
	})

	test('round-trips an encrypted version>=1 secret without re-encrypting (needsReEncrypt=false)', async () => {
		const providers = baseProviders()
		const otp = await otpAuthenticator.create('john', 'contember')
		const encrypted = await encrypt(Buffer.from(otp.secret, 'utf8'))
		const person: PersonRow = {
			...basePerson,
			otp_secret: encrypted.value,
			otp_secret_version: encrypted.version,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		const db = makeDb([], providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyOtp(db, person, token)).toBe(true)
		expect(await manager.verifyOtp(db, person, '000000')).toBe(false)
	})

	test('re-encrypts a version>=1 secret when decrypt signals needsReEncrypt', async () => {
		const providers = baseProviders({ decrypt: makeDecrypt(true) })
		const otp = await otpAuthenticator.create('john', 'contember')
		const encrypted = await encrypt(Buffer.from(otp.secret, 'utf8'))
		const person: PersonRow = {
			...basePerson,
			otp_secret: encrypted.value,
			otp_secret_version: encrypted.version,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)

		const queries: ExpectedQuery[] = [{
			sql: REENCRYPT_SQL,
			parameters: [Buffer.from(ENC_PREFIX + otp.secret), 2, person.id, encrypted.version],
			response: { rowCount: 1 },
		}]
		const db = makeDb(queries, providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyOtp(db, person, token)).toBe(true)
		expect(queries).toHaveLength(0)
	})

	test('verify still succeeds when re-encryption (encrypt) throws — best-effort swallow', async () => {
		const providers = baseProviders({
			encrypt: () => Promise.reject(new Error('encrypt boom')),
		})
		const otp = await otpAuthenticator.create('john', 'contember')
		const person: PersonRow = {
			...basePerson,
			otp_secret: Buffer.from(otp.uri, 'utf8'),
			otp_secret_version: 0,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		const db = makeDb([], providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyOtp(db, person, token)).toBe(true)
	})

	test('throws when no active secret is configured', async () => {
		const providers = baseProviders()
		const db = makeDb([], providers)
		const manager = new OtpManager(otpAuthenticator, providers)
		await expect(manager.verifyOtp(db, basePerson, '123456')).rejects.toBeInstanceOf(OtpError)
	})

	test('verifyPendingOtp validates against the pending slot and never re-encrypts', async () => {
		const providers = baseProviders({ decrypt: makeDecrypt(true) })
		const otp = await otpAuthenticator.create('john', 'contember')
		const encrypted = await encrypt(Buffer.from(otp.secret, 'utf8'))
		const person: PersonRow = {
			...basePerson,
			otp_pending_secret: encrypted.value,
			otp_pending_version: encrypted.version,
			otp_pending_created_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		const manager = new OtpManager(otpAuthenticator, providers)
		expect(await manager.verifyPendingOtp(person, token)).toBe(true)
	})
})
