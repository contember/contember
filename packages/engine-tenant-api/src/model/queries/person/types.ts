export interface PersonRow {
	readonly id: string
	readonly password_hash: string | null
	readonly identity_id: string
	readonly otp_secret: Buffer | null
	readonly otp_secret_version: number | null
	readonly otp_activated_at: Date | null
	readonly otp_pending_secret: Buffer | null
	readonly otp_pending_version: number | null
	readonly otp_pending_created_at: Date | null
	readonly email_otp_enabled: boolean
	readonly email: string | null
	readonly name: string | null
	readonly roles: string[]
	readonly disabled_at: Date | null
	readonly passwordless_enabled: boolean | null
	readonly mfa_grace_until: Date | null
	readonly email_verified_at: Date | null
	readonly email_verification_required: boolean
}

export type MaybePersonRow = PersonRow | null

/**
 * Slim row for person listings — only the columns {@link PersonResponseFactory}
 * surfaces. Deliberately excludes auth/secret material (`password_hash`,
 * `totp_secret*`) that the full {@link PersonRow} carries, so a bulk listing
 * never drags credentials into memory.
 */
export interface PersonListRow {
	readonly id: string
	readonly identity_id: string
	readonly email: string | null
	readonly name: string | null
	readonly otp_activated_at: Date | null
	readonly email_otp_enabled: boolean
	readonly passwordless_enabled: boolean | null
	readonly email_verified_at: Date | null
}
