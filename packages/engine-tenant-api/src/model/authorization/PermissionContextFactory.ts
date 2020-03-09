import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory'
import { PermissionContext } from './PermissionContext'
import { ProjectScopeFactory } from './ProjectScopeFactory'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
	) {}

	public create(args: { id: string; roles: string[] }): PermissionContext {
		return new PermissionContext(this.identityFactory.create(args), this.authorizator, this.projectScopeFactory)
	}
}
