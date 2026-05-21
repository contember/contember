import { describe, expect, test } from 'bun:test'
import { Buffer } from 'buffer'
import { OtpAuthenticator, OtpError, OtpManager, PersonRow } from '../../../src'

const now = new Date('2019-09-04 12:00')

const otpAuthenticator = new OtpAuthenticator({
	now: () => now,
	randomBytes: () => Promise.resolve(Buffer.alloc(20)),
})

// A reversible "encryption": prefixes the plaintext with a marker. decrypt strips it.
const ENC_PREFIX = 'ENC:'
const decrypt = (value: Buffer, version: number) => {
	expect(version).toBeGreaterThanOrEqual(1)
	const str = value.toString('utf8')
	if (!str.startsWith(ENC_PREFIX)) {
		throw new Error('cannot decrypt')
	}
	return Promise.resolve({ value: Buffer.from(str.slice(ENC_PREFIX.length), 'utf8'), needsReEncrypt: false })
}
const encrypt = (value: Buffer) => Promise.resolve({ value: Buffer.from(ENC_PREFIX + value.toString('utf8')), version: 1 })

const basePerson: PersonRow = {
	id: 'p1',
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
	test('validates a legacy version-0 (plaintext otpauth URI) secret', async () => {
		const manager = new OtpManager(otpAuthenticator, { decrypt })
		const otp = await otpAuthenticator.create('john', 'contember')
		const person: PersonRow = {
			...basePerson,
			otp_secret: Buffer.from(otp.uri, 'utf8'),
			otp_secret_version: 0,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		expect(await manager.verifyOtp(person, token)).toBe(true)
		expect(await manager.verifyOtp(person, '000000')).toBe(false)
	})

	test('round-trips an encrypted version>=1 secret', async () => {
		const manager = new OtpManager(otpAuthenticator, { decrypt })
		const otp = await otpAuthenticator.create('john', 'contember')
		const encrypted = await encrypt(Buffer.from(otp.secret, 'utf8'))
		const person: PersonRow = {
			...basePerson,
			otp_secret: encrypted.value,
			otp_secret_version: encrypted.version,
			otp_activated_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		expect(await manager.verifyOtp(person, token)).toBe(true)
		expect(await manager.verifyOtp(person, '000000')).toBe(false)
	})

	test('throws when no active secret is configured', async () => {
		const manager = new OtpManager(otpAuthenticator, { decrypt })
		await expect(manager.verifyOtp(basePerson, '123456')).rejects.toBeInstanceOf(OtpError)
	})

	test('verifyPendingOtp validates against the pending slot', async () => {
		const manager = new OtpManager(otpAuthenticator, { decrypt })
		const otp = await otpAuthenticator.create('john', 'contember')
		const encrypted = await encrypt(Buffer.from(otp.secret, 'utf8'))
		const person: PersonRow = {
			...basePerson,
			otp_pending_secret: encrypted.value,
			otp_pending_version: encrypted.version,
			otp_pending_created_at: now,
		}
		const token = otpAuthenticator.generate(otp)
		expect(await manager.verifyPendingOtp(person, token)).toBe(true)
	})
})
