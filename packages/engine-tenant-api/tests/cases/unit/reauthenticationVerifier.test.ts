import { describe, expect, test } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { createConnectionMock } from '@contember/database-tester'
import { DatabaseContext, OtpAuthenticator, OtpManager, PersonRow, Providers, ReauthenticationVerifier } from '../../../src/index.js'

const now = new Date('2026-11-06T12:00:00.000Z')
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: (value, hash) => Promise.resolve(hash === `hash-of-${value}`),
	now: () => now,
	randomBytes: bytes => Promise.resolve(Buffer.alloc(bytes)),
	uuid: () => 'uuid',
	decrypt: value => Promise.resolve({ value, needsReEncrypt: false }),
	encrypt: value => Promise.resolve({ value, version: 1 }),
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
}

const person = (overrides: Partial<PersonRow> = {}): PersonRow => ({
	id: '123e4567-e89b-12d3-a456-000000000001',
	password_hash: null,
	identity_id: '123e4567-e89b-12d3-a456-000000000002',
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
	is_in_grace: false,
	email_verified_at: null,
	email_verification_required: false,
	...overrides,
})

const withTotp = (overrides: Partial<PersonRow> = {}): PersonRow =>
	person({ otp_secret: Buffer.from(SECRET, 'utf8'), otp_secret_version: 1, otp_activated_at: now, ...overrides })

const currentCode = () => new TOTP({ secret: Secret.fromBase32(SECRET), digits: 6 }).generate({ timestamp: now.getTime() })

const verify = (target: PersonRow, credentials: { currentPassword?: string; otpToken?: string }) => {
	const db = new DatabaseContext(createConnectionMock([]).createClient('tenant', { module: 'tenant' }), providers)
	const otpManager = new OtpManager(new OtpAuthenticator(providers), providers)
	return new ReauthenticationVerifier(providers, otpManager).verify(db, target, credentials)
}

describe('ReauthenticationVerifier', () => {
	test('accepts the current password', async () => {
		expect((await verify(person({ password_hash: 'hash-of-secret' }), { currentPassword: 'secret' })).ok).toBe(true)
	})

	test('refuses a wrong password', async () => {
		const result = await verify(person({ password_hash: 'hash-of-secret' }), { currentPassword: 'other' })
		expect(result.ok ? null : result.error).toBe('INVALID_PASSWORD')
	})

	test('accepts a current TOTP code', async () => {
		expect((await verify(withTotp(), { otpToken: currentCode() })).ok).toBe(true)
	})

	test('refuses a wrong TOTP code', async () => {
		const code = currentCode() === '000000' ? '111111' : '000000'
		const result = await verify(withTotp(), { otpToken: code })
		expect(result.ok ? null : result.error).toBe('INVALID_OTP_TOKEN')
	})

	test('refuses a TOTP code when the person has no active TOTP', async () => {
		const result = await verify(withTotp({ otp_activated_at: null }), { otpToken: currentCode() })
		expect(result.ok ? null : result.error).toBe('INVALID_OTP_TOKEN')
	})

	test('a person without a password or TOTP cannot re-authenticate', async () => {
		const empty = await verify(person(), {})
		expect(empty.ok ? null : empty.error).toBe('REAUTHENTICATION_REQUIRED')
		const withPassword = await verify(person(), { currentPassword: 'anything' })
		expect(withPassword.ok ? null : withPassword.error).toBe('INVALID_PASSWORD')
	})
})
