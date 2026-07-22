export type CustomRoleRow = {
	readonly id: string
	readonly slug: string
	readonly description: string | null
	readonly permissions: readonly string[]
	readonly created_at: Date
	readonly updated_at: Date
}
