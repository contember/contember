import { describe, expect, test } from 'bun:test'
import { HCaptchaProvider } from '../../../src/model/service/captcha/HCaptchaProvider.js'
import { RecaptchaV3Provider } from '../../../src/model/service/captcha/RecaptchaV3Provider.js'
import { TurnstileProvider } from '../../../src/model/service/captcha/TurnstileProvider.js'

/** Builds a fetch stub returning the given JSON payload, capturing the request. */
const stubFetch = (payload: unknown) => {
	const calls: { url: string; body: URLSearchParams }[] = []
	const impl = (async (url: string, init: { body: URLSearchParams }) => {
		calls.push({ url, body: init.body })
		return { json: async () => payload } as unknown as Response
	}) as unknown as typeof fetch
	return { impl, calls }
}

const throwingFetch = (() => Promise.reject(new Error('network down'))) as unknown as typeof fetch

const args = (overrides: Partial<{ token: string; secret: string; remoteIp: string; threshold: number | null }> = {}) => ({
	token: overrides.token ?? 'tok',
	secret: overrides.secret ?? 'sec',
	remoteIp: overrides.remoteIp,
	threshold: overrides.threshold ?? null,
})

describe('TurnstileProvider', () => {
	test('ok on success', async () => {
		const { impl } = stubFetch({ success: true })
		expect(await new TurnstileProvider('https://t.test', impl).verify(args())).toEqual({ ok: true })
	})

	test('forwards secret/response/remoteip in the form body', async () => {
		const { impl, calls } = stubFetch({ success: true })
		await new TurnstileProvider('https://t.test', impl).verify(args({ secret: 's1', token: 't1', remoteIp: '9.9.9.9' }))
		expect(calls[0].url).toBe('https://t.test')
		expect(calls[0].body.get('secret')).toBe('s1')
		expect(calls[0].body.get('response')).toBe('t1')
		expect(calls[0].body.get('remoteip')).toBe('9.9.9.9')
	})

	test('omits remoteip when not provided', async () => {
		const { impl, calls } = stubFetch({ success: true })
		await new TurnstileProvider('https://t.test', impl).verify(args())
		expect(calls[0].body.has('remoteip')).toBe(false)
	})

	test('maps timeout-or-duplicate to expired', async () => {
		const { impl } = stubFetch({ success: false, 'error-codes': ['timeout-or-duplicate'] })
		const result = await new TurnstileProvider('https://t.test', impl).verify(args())
		expect(result).toEqual({ ok: false, reason: 'expired', detail: 'timeout-or-duplicate' })
	})

	test('maps invalid-input-response to expired', async () => {
		const { impl } = stubFetch({ success: false, 'error-codes': ['invalid-input-response'] })
		expect((await new TurnstileProvider('https://t.test', impl).verify(args())).ok).toBe(false)
		const result = await new TurnstileProvider('https://t.test', impl).verify(args())
		if (!result.ok) {
			expect(result.reason).toBe('expired')
		}
	})

	test('maps other error codes to invalid', async () => {
		const { impl } = stubFetch({ success: false, 'error-codes': ['bad-request'] })
		expect(await new TurnstileProvider('https://t.test', impl).verify(args())).toEqual({
			ok: false,
			reason: 'invalid',
			detail: 'bad-request',
		})
	})

	test('verify_error when fetch throws', async () => {
		const result = await new TurnstileProvider('https://t.test', throwingFetch).verify(args())
		expect(result).toEqual({ ok: false, reason: 'verify_error', detail: 'network down' })
	})
})

describe('HCaptchaProvider', () => {
	test('ok on success', async () => {
		const { impl } = stubFetch({ success: true })
		expect(await new HCaptchaProvider('https://h.test', impl).verify(args())).toEqual({ ok: true })
	})

	test('invalid on failure with joined error codes', async () => {
		const { impl } = stubFetch({ success: false, 'error-codes': ['missing-input-secret', 'invalid-input-response'] })
		expect(await new HCaptchaProvider('https://h.test', impl).verify(args())).toEqual({
			ok: false,
			reason: 'invalid',
			detail: 'missing-input-secret,invalid-input-response',
		})
	})

	test('verify_error when fetch throws', async () => {
		const result = await new HCaptchaProvider('https://h.test', throwingFetch).verify(args())
		expect(result).toEqual({ ok: false, reason: 'verify_error', detail: 'network down' })
	})
})

describe('RecaptchaV3Provider', () => {
	test('ok with score when score >= configured threshold', async () => {
		const { impl } = stubFetch({ success: true, score: 0.8 })
		expect(await new RecaptchaV3Provider('https://r.test', impl).verify(args({ threshold: 0.7 }))).toEqual({ ok: true, score: 0.8 })
	})

	test('low_score when score < configured threshold', async () => {
		const { impl } = stubFetch({ success: true, score: 0.3 })
		const result = await new RecaptchaV3Provider('https://r.test', impl).verify(args({ threshold: 0.7 }))
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.reason).toBe('low_score')
			expect(result.detail).toBe('score=0.3 < 0.7')
		}
	})

	test('falls back to default threshold 0.5 when none configured', async () => {
		const { impl } = stubFetch({ success: true, score: 0.49 })
		const result = await new RecaptchaV3Provider('https://r.test', impl).verify(args({ threshold: null }))
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.reason).toBe('low_score')
			expect(result.detail).toBe('score=0.49 < 0.5')
		}
	})

	test('ok at the default threshold boundary (0.5)', async () => {
		const { impl } = stubFetch({ success: true, score: 0.5 })
		expect(await new RecaptchaV3Provider('https://r.test', impl).verify(args({ threshold: null }))).toEqual({ ok: true, score: 0.5 })
	})

	test('invalid when success is false', async () => {
		const { impl } = stubFetch({ success: false, 'error-codes': ['timeout-or-duplicate'] })
		expect(await new RecaptchaV3Provider('https://r.test', impl).verify(args())).toEqual({
			ok: false,
			reason: 'invalid',
			detail: 'timeout-or-duplicate',
		})
	})

	test('treats a missing score as 0 (low_score)', async () => {
		const { impl } = stubFetch({ success: true })
		const result = await new RecaptchaV3Provider('https://r.test', impl).verify(args({ threshold: 0.5 }))
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.reason).toBe('low_score')
		}
	})

	test('verify_error when fetch throws', async () => {
		const result = await new RecaptchaV3Provider('https://r.test', throwingFetch).verify(args())
		expect(result).toEqual({ ok: false, reason: 'verify_error', detail: 'network down' })
	})
})
