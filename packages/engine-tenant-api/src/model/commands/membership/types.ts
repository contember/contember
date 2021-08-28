export type VariableUpdateInput =
	& { name: string }
	& (
		| {
			set: ReadonlyArray<string>
	  }
		| {
			remove: ReadonlyArray<string>
			append: ReadonlyArray<string>
	  }
	)

export type MembershipInput = {
	role: string
	variables: VariableUpdateInput[]
}

export type MembershipUpdateInput = {
	role: string
	operation: 'update' | 'create' | 'remove'
	variables: VariableUpdateInput[]
}
