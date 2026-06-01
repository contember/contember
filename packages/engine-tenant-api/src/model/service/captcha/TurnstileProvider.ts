import { CaptchaProviderHandler, CaptchaVerifyArgs, CaptchaVerifyResult } from './CaptchaProvider.js'

/**
 * Cloudflare Turnstile. Binary success/failure — `threshold` is ignored.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export class TurnstileProvider implements CaptchaProviderHandler {
	constructor(
		private readonly endpoint: string = 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	async verify({ token, secret, remoteIp }: CaptchaVerifyArgs): Promise<CaptchaVerifyResult> {
		const body = new URLSearchParams({ secret, response: token })
		if (remoteIp) {
			body.set('remoteip', remoteIp)
		}
		let payload: { success?: boolean; 'error-codes'?: string[] }
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
		if (payload.success) {
			return { ok: true }
		}
		const codes = payload['error-codes'] ?? []
		if (codes.includes('timeout-or-duplicate') || codes.includes('invalid-input-response')) {
			return { ok: false, reason: 'expired', detail: codes.join(',') }
		}
		return { ok: false, reason: 'invalid', detail: codes.join(',') }
	}
}
