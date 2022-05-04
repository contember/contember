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
		return this.memberships.some(invokerMembership => {
			const matchRule = invokerMembership.matchRule[membership.role]
			if (!matchRule) {
				return false
			}
			if (matchRule === true) {
				return true
			}
			const variables = matchRule?.variables
			if (variables === true) {
				return true
			}
			return membership.variables.every(variable => {
				const sourceVariableRule = variables?.[variable.name]
				if (!sourceVariableRule) {
					return false
				}
				if (sourceVariableRule === true) {
					return true
				}
				const sourceVariable = invokerMembership.variables.find(it => typeof sourceVariableRule === 'string' && it.name === sourceVariableRule)
				if (!sourceVariable) {
					return false
				}
				const sourceValues = new Set(sourceVariable.values)
				return variable.values.every(it => sourceValues.has(it))
			})
		})
	}
}
