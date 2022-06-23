import { Permissions } from '@contember/authorization'
import { ProjectRole } from '@contember/schema'
import { AuthorizationActions } from './AuthorizationActions.js'

export class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(ProjectRole.ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })
		permissions.allow(ProjectRole.DEPLOYER, AuthorizationActions.PROJECT_MIGRATE)

		return permissions
	}
}
