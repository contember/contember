export interface PersonRow {
	readonly id: string
	readonly password_hash: string | null
	readonly identity_id: string
	readonly otp_uri: string | null
	readonly otp_activated_at: Date | null
	readonly email: string | null
	readonly name: string | null
	readonly roles: string[]
	readonly disabled_at: Date | null
	readonly passwordless_enabled: boolean | null
}

export type MaybePersonRow = PersonRow | null
