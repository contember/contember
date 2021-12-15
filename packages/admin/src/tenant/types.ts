export interface Membership {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}
