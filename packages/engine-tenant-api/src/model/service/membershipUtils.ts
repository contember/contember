import { Membership, MembershipVariable } from '../type/Membership'
import { MembershipInput, MembershipUpdateInput, VariableUpdateInput } from '../commands/membership'

export const createSetMembershipVariables = (memberships: readonly Membership[]): MembershipInput[] => {
	return memberships.map(it => ({
		role: it.role,
		variables: it.variables.map(it => ({ name: it.name, set: it.values })),
	}))
}
export const createAppendMembershipVariables = (memberships: readonly Membership[]): MembershipInput[] => {
	return memberships.map(it => ({
		role: it.role,
		variables: it.variables.map(it => ({ name: it.name, append: it.values, remove: [] })),
	}))
}

export const createMembershipModification = (
	oldMemberships: readonly Membership[],
	newMemberships: readonly Membership[],
): MembershipUpdateInput[] => {
	const input: MembershipUpdateInput[] = []
	for (const membership of newMemberships) {
		const old = oldMemberships.find(it => it.role === membership.role)
		if (!old) {
			input.push({
				role: membership.role,
				operation: 'create',
				variables: createMembershipVariablePatch([], membership.variables),
			})
		} else {
			input.push({
				role: membership.role,
				operation: 'update',
				variables: createMembershipVariablePatch(old.variables, membership.variables),
			})
		}
	}
	for (const old of oldMemberships) {
		const newMembership = newMemberships.find(it => it.role === old.role)
		if (!newMembership) {
			input.push({
				role: old.role,
				operation: 'remove',
				variables: createMembershipVariablePatch(old.variables, []), // for acl check
			})
		}
	}

	return input
}

const createMembershipVariablePatch = (
	oldVariables: readonly MembershipVariable[],
	newVariables: readonly MembershipVariable[],
): VariableUpdateInput[] => {
	const update: VariableUpdateInput[] = []
	const varANames = newVariables.map(it => it.name)
	for (const varA of newVariables) {
		const varB = oldVariables.find(it => it.name === varA.name)
		if (!varB) {
			update.push({
				name: varA.name,
				set: varA.values,
			})
		} else {
			update.push({
				name: varA.name,
				append: varA.values.filter(valA => !varB.values.includes(valA)),
				remove: varB.values.filter(valB => !varA.values.includes(valB)),
			})
		}
	}
	update.push(
		...oldVariables
			.filter(varB => !varANames.includes(varB.name))
			.map(it => ({
				name: it.name,
				set: [],
			})),
	)
	return update
}
