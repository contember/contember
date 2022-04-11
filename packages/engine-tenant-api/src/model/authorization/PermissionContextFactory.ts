import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory'
import { PermissionContext } from './PermissionContext'
import { ProjectScopeFactory } from './ProjectScopeFactory'
import { ProjectGroup } from '../type'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
	) {}

	public create(projectGroup: ProjectGroup, args: { id: string; roles: readonly string[] }): PermissionContext {
		const identity = this.identityFactory.create(projectGroup.database, args)
		return new PermissionContext(identity, this.authorizator, this.projectScopeFactory, projectGroup)
	}
}
