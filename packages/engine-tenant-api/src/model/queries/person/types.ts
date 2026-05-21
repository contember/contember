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
}

export type MaybePersonRow = PersonRow | null
