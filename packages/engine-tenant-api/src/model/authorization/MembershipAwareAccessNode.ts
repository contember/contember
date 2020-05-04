import { AccessEvaluator, AccessNode, Authorizator } from '@contember/authorization'
import { Membership } from '../type/Membership'
import { Acl } from '@contember/schema'

export class MembershipAwareAccessNode implements AccessNode {
	constructor(private readonly memberships: readonly Membership[], private readonly aclSchema: Acl.Schema) {}

	async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
		if (!this.isActionWithMemberships(action)) {
			return false
		}
		const { memberships } = action.meta
		for (const membership of memberships) {
			if (!this.verifyCanManageMembership(membership)) {
				return false
			}
		}
		return true
	}

	private isActionWithMemberships(
		action: Authorizator.Action<any>,
	): action is Authorizator.Action<{ memberships: Membership[] }> {
		if (!('meta' in action)) {
			return false
		}
		return 'memberships' in action.meta
	}

	private verifyCanManageMembership(membership: Membership): boolean {
		nextMembership: for (const invokerMembership of this.memberships) {
			const role = this.aclSchema.roles[invokerMembership.role]
			const tenantAcl = role?.tenant?.manage
			if (!tenantAcl) {
				continue
			}
			const roleAcl = tenantAcl[membership.role]
			if (!roleAcl) {
				continue
			}
			for (const variable of membership.variables) {
				const sourceVariableName = roleAcl.variables[variable.name]
				if (!sourceVariableName) {
					continue nextMembership
				}
				const sourceVariable = invokerMembership.variables.find(it => it.name === sourceVariableName)
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
