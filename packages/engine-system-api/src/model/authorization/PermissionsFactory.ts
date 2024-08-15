import { Permissions } from '@contember/authorization'
import { ProjectRole } from '@contember/schema'
import { AuthorizationActions } from './AuthorizationActions'

export class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(ProjectRole.ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })
		permissions.allow(ProjectRole.DEPLOYER, AuthorizationActions.PROJECT_MIGRATE)
		permissions.allow(ProjectRole.DEPLOYER, AuthorizationActions.PROJECT_LIST_MIGRATIONS)
		permissions.allow(ProjectRole.DEPLOYER, AuthorizationActions.PROJECT_SHOW_SCHEMA)

		return permissions
	}
}
