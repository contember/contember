import { AccessNode } from '@contember/authorization'
import { PermissionActions } from './PermissionActions'
import { Acl } from '@contember/schema'
import { MembershipMatcher } from './MembershipMatcher'
import { DirectPermissionsAccessNode } from './DirectPermissionsAccessNode'

export class AclSchemaAccessNodeFactory {
	create(schema: Acl.Schema, memberships: readonly Acl.Membership[]): AccessNode {
		const membershipMatcher = new MembershipMatcher(memberships.map(it => ({
			...it,
			matchRule: schema.roles[it.role]?.tenant?.manage ?? {},
		})))

		const verifier = ({ memberships }: { memberships: readonly Acl.Membership[] }) => {
			return memberships.every(it => membershipMatcher.matches(it))
		}
		const membershipRoles = memberships.map(it => schema.roles[it.role]).filter(it => !!it)
		const node = new DirectPermissionsAccessNode()
		if (membershipRoles.some(it => it.tenant?.invite)) {
			node.allow(PermissionActions.PERSON_INVITE([]), verifier)
		}
		if (membershipRoles.some(it => it.tenant?.unmanagedInvite)) {
			node.allow(PermissionActions.PERSON_INVITE_UNMANAGED([]), verifier)
		}
		if (membershipRoles.some(it => it.tenant?.manage)) {
			node.allow(PermissionActions.PROJECT_ADD_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_VIEW_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_UPDATE_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_REMOVE_MEMBER([]), verifier)
		}
		return node
	}
}
