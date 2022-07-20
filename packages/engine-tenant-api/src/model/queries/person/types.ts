export interface PersonRow {
	readonly id: string
	readonly password_hash: string | null
	readonly identity_id: string
	readonly otp_uri: string | null
	readonly otp_activated_at: Date | null
	readonly email?: string
	readonly name?: string
	readonly roles: string[]
}

export type MaybePersonRow = PersonRow | null
