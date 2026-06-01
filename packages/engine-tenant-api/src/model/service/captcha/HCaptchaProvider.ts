import { CaptchaProviderHandler, CaptchaVerifyArgs, CaptchaVerifyResult } from './CaptchaProvider.js'

/** hCaptcha. Binary success/failure — `threshold` is ignored. */
export class HCaptchaProvider implements CaptchaProviderHandler {
	constructor(
		private readonly endpoint: string = 'https://hcaptcha.com/siteverify',
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
		return { ok: false, reason: 'invalid', detail: (payload['error-codes'] ?? []).join(',') }
	}
}
