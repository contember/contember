import { describe, expect, test } from 'bun:test'
import { CaptchaConfig, CaptchaValidator } from '../../../src/model/service/captcha/CaptchaValidator.js'
import { CaptchaProviderHandler, CaptchaVerifyArgs, CaptchaVerifyResult } from '../../../src/model/service/captcha/CaptchaProvider.js'

class StubProvider implements CaptchaProviderHandler {
	public lastArgs: CaptchaVerifyArgs | null = null
	constructor(private readonly response: CaptchaVerifyResult) {}
	async verify(args: CaptchaVerifyArgs): Promise<CaptchaVerifyResult> {
		this.lastArgs = args
		return this.response
	}
}

const buildValidator = (response: CaptchaVerifyResult) =>
	new CaptchaValidator({
		turnstile: new StubProvider(response),
		hcaptcha: new StubProvider(response),
		recaptchaV3: new StubProvider(response),
	})

describe('CaptchaValidator', () => {
	test('is disabled when provider is null', () => {
		const validator = buildValidator({ ok: true })
		const config: CaptchaConfig = { provider: null, secret: 'whatever', threshold: null }
		expect(validator.isEnabled(config)).toBe(false)
	})

	test('is disabled when secret is missing', () => {
		const validator = buildValidator({ ok: true })
		const config: CaptchaConfig = { provider: 'turnstile', secret: null, threshold: null }
		expect(validator.isEnabled(config)).toBe(false)
	})

	test('verify skips when disabled', async () => {
		const validator = buildValidator({ ok: true })
		const result = await validator.verify({
			config: { provider: null, secret: null, threshold: null },
			token: 'irrelevant',
		})
		expect(result).toEqual({ ok: true, skipped: true })
	})

	test('verify rejects when token is missing while enabled', async () => {
		const validator = buildValidator({ ok: true })
		const result = await validator.verify({
			config: { provider: 'turnstile', secret: 'secret', threshold: null },
			token: undefined,
		})
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.reason).toBe('invalid')
		}
	})

	test('verify delegates to the configured provider', async () => {
		const validator = buildValidator({ ok: true, score: 0.9 })
		const result = await validator.verify({
			config: { provider: 'recaptchaV3', secret: 'secret', threshold: 0.5 },
			token: 'abc',
			remoteIp: '1.2.3.4',
		})
		expect(result.ok).toBe(true)
	})
})
