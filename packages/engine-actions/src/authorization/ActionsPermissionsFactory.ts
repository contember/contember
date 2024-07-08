import { Permissions } from '@contember/authorization'
import { ProjectRole } from '@contember/schema'
import { ActionsAuthorizationActions } from './ActionsAuthorizationActions'

export class ActionsPermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(ProjectRole.ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })
		permissions.allow(ProjectRole.DEPLOYER, ActionsAuthorizationActions.VARIABLES_SET)
		permissions.allow(ProjectRole.DEPLOYER, ActionsAuthorizationActions.VARIABLES_VIEW)

		return permissions
	}
}
