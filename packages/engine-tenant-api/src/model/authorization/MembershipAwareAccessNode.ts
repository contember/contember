import { AccessEvaluator, AccessNode, Authorizator } from '@contember/authorization'
import { Membership } from '../type'
import { Acl } from '@contember/schema'
import { MembershipMatcher } from './MembershipMatcher'

export class MembershipAwareAccessNode implements AccessNode {
	private readonly membershipMatcher: MembershipMatcher

	constructor(memberships: readonly Membership[], aclSchema: Acl.Schema) {
		this.membershipMatcher = new MembershipMatcher(memberships.map(it => ({
			...it,
			matchRule: aclSchema.roles[it.role]?.tenant?.manage ?? {},
		})))
	}

	async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
		if (!this.isActionWithMemberships(action)) {
			return false
		}
		const { memberships } = action.meta
		for (const membership of memberships) {
			if (!this.membershipMatcher.matches(membership)) {
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
}
