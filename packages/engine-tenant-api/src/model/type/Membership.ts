export interface MembershipVariable {
	readonly name: string
	readonly values: readonly string[]
}

export interface Membership {
	readonly role: string
	readonly variables: readonly MembershipVariable[]
}
