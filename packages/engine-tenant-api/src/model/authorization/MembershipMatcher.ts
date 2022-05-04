import { Membership } from '../type'
import { Acl } from '@contember/schema'

export type MembershipWithSubMembershipMatchRules =
	& Membership
	& {
		matchRule: Acl.MembershipMatchRule
	}

export class MembershipMatcher {
	constructor(private readonly memberships: readonly MembershipWithSubMembershipMatchRules[]) {
	}

	matches(membership: Membership): boolean {
		nextMembership: for (const invokerMembership of this.memberships) {
			const matchRule = invokerMembership.matchRule
			const roleAcl = matchRule[membership.role]
			if (!roleAcl) {
				continue
			}
			if (roleAcl.variables === true) {
				return true
			}
			for (const variable of membership.variables) {
				const sourceVariableRule = roleAcl.variables?.[variable.name]
				if (!sourceVariableRule) {
					continue nextMembership
				}
				if (sourceVariableRule === true) {
					continue // ok
				}
				const sourceVariable = invokerMembership.variables.find(it => typeof sourceVariableRule === 'string' && it.name === sourceVariableRule)
				if (!sourceVariable) {
					continue nextMembership
				}
				const sourceValues = new Set(sourceVariable.values)
				if (!variable.values.every(it => sourceValues.has(it))) {
					continue nextMembership
				}
			}
			return true
		}
		return false
	}
}
