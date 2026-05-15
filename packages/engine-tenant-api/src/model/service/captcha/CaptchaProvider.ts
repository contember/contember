export interface CaptchaProviderHandler {
	/**
	 * Verify a client-submitted captcha token with the provider. Implementations
	 * should never throw on remote failure — return `verifyError` so the caller
	 * can decide whether to fail-open or fail-closed.
	 */
	verify(args: CaptchaVerifyArgs): Promise<CaptchaVerifyResult>
}

export interface CaptchaVerifyArgs {
	readonly token: string
	readonly secret: string
	readonly remoteIp?: string
	/** Score gate for v3-style providers; ignored by binary providers. */
	readonly threshold: number | null
}

export type CaptchaVerifyResult =
	| { ok: true; score?: number }
	| { ok: false; reason: 'invalid' | 'low_score' | 'expired' | 'verify_error'; detail?: string }
