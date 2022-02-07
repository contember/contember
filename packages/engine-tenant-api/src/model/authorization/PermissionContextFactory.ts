import { Authorizator } from '@contember/authorization'
import { IdentityFactory } from './IdentityFactory'
import { PermissionContext } from './PermissionContext'
import { ProjectScopeFactory } from './ProjectScopeFactory'
import { ProjectSchemaResolver } from '../type'
import { DatabaseContext } from '../utils'

export class PermissionContextFactory {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly identityFactory: IdentityFactory,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
	) {}

	public create(db: DatabaseContext, args: { id: string; roles: string[] }): PermissionContext {
		const identity = this.identityFactory.create(db, args)
		return new PermissionContext(identity, this.authorizator, this.projectScopeFactory, this.schemaResolver)
	}
}
