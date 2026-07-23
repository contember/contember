export type CustomRoleRow = {
	readonly id: string
	readonly slug: string
	readonly description: string | null
	readonly grants: unknown
	readonly created_at: Date
	readonly updated_at: Date
	readonly deleted_at: Date | null
}
