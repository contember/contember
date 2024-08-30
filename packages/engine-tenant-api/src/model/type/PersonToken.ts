export namespace PersonToken {
	export type Type = 'password_reset' | 'passwordless'
	export type ValidationType = 'token' | 'otp'

	export interface Row {
		id: string
		created_at: Date
		token_hash: string
		used_at: null | Date
		expires_at: Date
		person_id: string
		otp_hash: string | null
		otp_attempts: number
	}

	export type TokenValidationError =
		| 'TOKEN_NOT_FOUND'
		| 'TOKEN_INVALID'
		| 'TOKEN_USED'
		| 'TOKEN_EXPIRED'
}
