import { Config } from '../../type/Config.js'
import { CaptchaProvider as CaptchaProviderKey } from '../../../schema/index.js'
import { CaptchaProviderHandler, CaptchaVerifyResult } from './CaptchaProvider.js'

export interface CaptchaConfig {
	readonly provider: CaptchaProviderKey | null
	readonly secret: string | null
	readonly threshold: number | null
}

export class CaptchaValidator {
	constructor(
		private readonly providers: Record<CaptchaProviderKey, CaptchaProviderHandler>,
	) {}

	/** True when the tenant has opted into captcha (provider+secret both set). */
	public isEnabled(config: CaptchaConfig): boolean {
		return config.provider !== null && config.secret !== null && config.secret !== ''
	}

	/**
	 * Extract just the captcha-relevant fields from a loaded tenant Config so
	 * services only pass what they need.
	 */
	public extractConfig(config: Config): CaptchaConfig {
		return {
			provider: config.captcha.provider ?? null,
			secret: config.captchaSecret,
			threshold: config.captcha.threshold ?? null,
		}
	}

	async verify(args: {
		config: CaptchaConfig
		token: string | null | undefined
		remoteIp?: string
	}): Promise<CaptchaVerifyResult | { ok: true; skipped: true }> {
		if (!this.isEnabled(args.config) || !args.config.provider || !args.config.secret) {
			return { ok: true, skipped: true }
		}
		if (!args.token) {
			return { ok: false, reason: 'invalid', detail: 'captcha token missing' }
		}
		const handler = this.providers[args.config.provider]
		if (!handler) {
			return { ok: false, reason: 'verify_error', detail: `no handler registered for provider ${args.config.provider}` }
		}
		return await handler.verify({
			token: args.token,
			secret: args.config.secret,
			remoteIp: args.remoteIp,
			threshold: args.config.threshold,
		})
	}
}
