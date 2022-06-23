import { AccessEvaluator, Permissions } from '@contember/authorization'
import { PermissionActions } from './PermissionActions.js'
import { Acl } from '@contember/schema'

export class AclSchemaEvaluatorFactory {
	async create(schema: Acl.Schema): Promise<AccessEvaluator> {
		const permissions = new Permissions()
		Object.entries(schema.roles).forEach(([role, definition]) => {
			if (!definition.tenant) {
				return
			}
			if (definition.tenant.invite) {
				permissions.allow(role, PermissionActions.PERSON_INVITE([]))
			}
			if (definition.tenant.unmanagedInvite) {
				permissions.allow(role, PermissionActions.PERSON_INVITE_UNMANAGED([]))
			}
			if (definition.tenant.manage) {
				permissions.allow(role, PermissionActions.PROJECT_ADD_MEMBER([]))
				permissions.allow(role, PermissionActions.PROJECT_VIEW_MEMBER([]))
				permissions.allow(role, PermissionActions.PROJECT_UPDATE_MEMBER([]))
				permissions.allow(role, PermissionActions.PROJECT_REMOVE_MEMBER([]))
			}
		})
		return new AccessEvaluator.PermissionEvaluator(permissions)
	}
}
