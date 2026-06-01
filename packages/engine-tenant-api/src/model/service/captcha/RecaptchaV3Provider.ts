import { CaptchaProviderHandler, CaptchaVerifyArgs, CaptchaVerifyResult } from './CaptchaProvider.js'

const DEFAULT_THRESHOLD = 0.5

/**
 * Google reCAPTCHA v3 — score-based. Falls back to DEFAULT_THRESHOLD when no
 * config-level threshold is set.
 */
export class RecaptchaV3Provider implements CaptchaProviderHandler {
	constructor(
		private readonly endpoint: string = 'https://www.google.com/recaptcha/api/siteverify',
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	async verify({ token, secret, remoteIp, threshold }: CaptchaVerifyArgs): Promise<CaptchaVerifyResult> {
		const body = new URLSearchParams({ secret, response: token })
		if (remoteIp) {
			body.set('remoteip', remoteIp)
		}
		let payload: { success?: boolean; score?: number; 'error-codes'?: string[] }
		try {
			const response = await this.fetchImpl(this.endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body,
			})
			payload = await response.json() as typeof payload
		} catch (e) {
			return { ok: false, reason: 'verify_error', detail: e instanceof Error ? e.message : String(e) }
		}
		if (!payload.success) {
			return { ok: false, reason: 'invalid', detail: (payload['error-codes'] ?? []).join(',') }
		}
		const score = payload.score ?? 0
		const gate = threshold ?? DEFAULT_THRESHOLD
		if (score < gate) {
			return { ok: false, reason: 'low_score', detail: `score=${score} < ${gate}` }
		}
		return { ok: true, score }
	}
}
