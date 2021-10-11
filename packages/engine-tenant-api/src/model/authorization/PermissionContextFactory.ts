import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory'
import { PermissionContext } from './PermissionContext'
import { ProjectScopeFactory } from './ProjectScopeFactory'
import { DatabaseContext } from '../utils'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
	) {}

	public create(dbContext: DatabaseContext, args: { id: string; roles: string[] }): PermissionContext {
		return new PermissionContext(this.identityFactory.create(dbContext, args), this.authorizator, this.projectScopeFactory, dbContext)
	}
}
