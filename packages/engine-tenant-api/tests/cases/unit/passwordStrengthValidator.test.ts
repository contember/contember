import { describe, expect, test } from 'bun:test'
import { PasswordStrengthValidator } from '../../../src/model/service/PasswordStrengthValidator.js'
import { HibpChecker } from '../../../src/model/service/HibpChecker.js'

const passwordConfig = {
	minLength: 6,
	requireUppercase: 0,
	requireLowercase: 0,
	requireDigit: 0,
	requireSpecial: 0,
	pattern: null,
	checkBlacklist: false,
	checkHibp: false,
	revokeSessionsOnChange: false,
}

class StubHibp implements HibpChecker {
	constructor(private readonly result: boolean) {}
	async isCompromised(): Promise<boolean> {
		return this.result
	}
}

describe('PasswordStrengthValidator', () => {
	test('passes a strong, uncompromised password', async () => {
		const validator = new PasswordStrengthValidator(new StubHibp(false))
		const result = await validator.verify('correct horse battery staple', passwordConfig, 'WEAK')
		expect(result.ok).toBe(true)
	})

	test('does not call HIBP when checkHibp is false', async () => {
		// If we *did* call it, this stub would return true and trip COMPROMISED.
		const validator = new PasswordStrengthValidator(new StubHibp(true))
		const result = await validator.verify('correct horse battery staple', passwordConfig, 'WEAK')
		expect(result.ok).toBe(true)
	})

	test('returns COMPROMISED when HIBP says so and checkHibp is on', async () => {
		const validator = new PasswordStrengthValidator(new StubHibp(true))
		const result = await validator.verify('correct horse battery staple', { ...passwordConfig, checkHibp: true }, 'WEAK')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.metadata?.weakPasswordReasons).toContain('COMPROMISED')
		}
	})

	test('passes when HIBP says clean and checkHibp is on', async () => {
		const validator = new PasswordStrengthValidator(new StubHibp(false))
		const result = await validator.verify('correct horse battery staple', { ...passwordConfig, checkHibp: true }, 'WEAK')
		expect(result.ok).toBe(true)
	})

	test('accepts a password of exactly 72 bytes', async () => {
		const validator = new PasswordStrengthValidator(new StubHibp(false))
		expect((await validator.verify('a'.repeat(72), passwordConfig, 'WEAK')).ok).toBe(true)
		// 36 two-byte characters
		expect((await validator.verify('ž'.repeat(36), passwordConfig, 'WEAK')).ok).toBe(true)
	})

	test('refuses a password longer than 72 bytes, counting UTF-8 bytes, without checking HIBP', async () => {
		const validator = new PasswordStrengthValidator(new StubHibp(true))
		for (const password of ['a'.repeat(73), 'ž'.repeat(37)]) {
			const result = await validator.verify(password, { ...passwordConfig, checkHibp: true }, 'WEAK')
			expect(result.ok ? null : { error: result.error, reasons: result.metadata?.weakPasswordReasons }).toEqual({ error: 'WEAK', reasons: ['TOO_LONG'] })
		}
	})
})
