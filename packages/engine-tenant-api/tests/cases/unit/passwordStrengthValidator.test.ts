import { describe, expect, test } from 'bun:test'
import { PasswordStrengthValidator } from '../../../src/model/service/PasswordStrengthValidator'
import { HibpChecker } from '../../../src/model/service/HibpChecker'

const passwordConfig = {
	minLength: 6,
	requireUppercase: 0,
	requireLowercase: 0,
	requireDigit: 0,
	requireSpecial: 0,
	pattern: null,
	checkBlacklist: false,
	checkHibp: false,
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
})
