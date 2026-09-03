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

/**
 * A32 — the IdP claim mapping's claim on a membership it granted: a validated Postgres interval the
 * grant is good for, plus the provider accountable for it.
 *
 * Both are written together, on every apply, so a renewal is just another write. The provider is
 * recorded even though nothing reads it yet for authorization: it is what lets an expiry name its
 * grantor, and it is the hook a rule binding the grant to sessions from that same provider would use.
 */
export type MembershipLease = {
	readonly duration: string
	readonly identityProviderId: string
}
