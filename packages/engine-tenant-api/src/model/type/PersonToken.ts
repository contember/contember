export namespace PersonToken {
	export type Type = 'password_reset' | 'passwordless' | 'mfa_email_otp' | 'email_verification' | 'email_change'
	export type ValidationType = 'token' | 'otp'

	/** Payload carried by an email_change token: the pending new address. */
	export interface EmailChangeMeta {
		email: string
	}

	export interface Row {
		id: string
		created_at: Date
		token_hash: string
		used_at: null | Date
		expires_at: Date
		person_id: string
		otp_hash: string | null
		otp_attempts: number
		meta: EmailChangeMeta | null
	}

	export type TokenValidationError =
		| 'TOKEN_NOT_FOUND'
		| 'TOKEN_INVALID'
		| 'TOKEN_USED'
		| 'TOKEN_EXPIRED'
}
