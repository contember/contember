export namespace PersonToken {
	export type Type = 'password_reset' | 'passwordless' | 'mfa_email_otp' | 'email_verification' | 'email_change'
	export type ValidationType = 'token' | 'otp'

	/**
	 * Payload carried by an e-mail-bearing token: the address the token is bound
	 * to. For email_change it is the pending NEW address; for email_verification
	 * it is the address being verified at the time the token was issued.
	 */
	export interface TokenMeta {
		email: string
	}

	export interface Row {
		id: string
		created_at: Date
		token_hash: string
		used_at: null | Date
		expires_at: Date
		/** `expires_at <= now()` computed on the DB clock — the authoritative expiry gate. */
		is_expired: boolean
		person_id: string
		otp_hash: string | null
		otp_attempts: number
		meta: TokenMeta | null
	}

	export type TokenValidationError =
		| 'TOKEN_NOT_FOUND'
		| 'TOKEN_INVALID'
		| 'TOKEN_USED'
		| 'TOKEN_EXPIRED'
}
