import { AccessNode } from '@contember/authorization'
import { PermissionActions } from './PermissionActions'
import { Acl } from '@contember/schema'
import { MembershipMatcher } from './MembershipMatcher'
import { DirectPermissionsAccessNode } from './DirectPermissionsAccessNode'

export class AclSchemaAccessNodeFactory {
	create(schema: Acl.Schema, memberships: readonly Acl.Membership[]): AccessNode {

		const createVerifier = (getRule: (permissions: Acl.TenantPermissions) => Acl.MembershipMatchRule) => {
			const membershipMatcher = new MembershipMatcher(memberships.map(it => ({
				...it,
				matchRule: getRule(schema.roles[it.role]?.tenant ?? {}),
			})))

			return ({ memberships }: { memberships: readonly Acl.Membership[] }) => {
				return memberships.every(it => membershipMatcher.matches(it))
			}
		}

		const membershipRoles = memberships.map(it => schema.roles[it.role]).filter(it => !!it)
		const node = new DirectPermissionsAccessNode()

		if (membershipRoles.some(it => it.tenant?.invite)) {
			const verifier = createVerifier(it => it.invite && it.invite !== true ? it.invite : it.manage ?? {})
			node.allow(PermissionActions.PERSON_INVITE([]), verifier)
		}

		if (membershipRoles.some(it => it.tenant?.unmanagedInvite)) {
			const verifier = createVerifier(it => it.unmanagedInvite && it.unmanagedInvite !== true ? it.unmanagedInvite : it.manage ?? {})
			node.allow(PermissionActions.PERSON_INVITE_UNMANAGED([]), verifier)
		}

		if (membershipRoles.some(it => it.tenant?.manage)) {
			const verifier = createVerifier(it => it.manage ?? {})
			node.allow(PermissionActions.PROJECT_ADD_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_VIEW_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_UPDATE_MEMBER([]), verifier)
			node.allow(PermissionActions.PROJECT_REMOVE_MEMBER([]), verifier)
		}

		if (membershipRoles.some(it => it.tenant?.view)) {
			const verifier = createVerifier(it => it.view ?? {})
			node.allow(PermissionActions.PROJECT_VIEW_MEMBER([]), verifier)
		}

		return node
	}
}
