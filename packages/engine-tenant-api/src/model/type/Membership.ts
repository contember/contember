export interface Membership {
	role: string
	variables: readonly {
		name: string
		values: readonly string[]
	}[]
}
